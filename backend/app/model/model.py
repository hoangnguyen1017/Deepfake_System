import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.ops import StochasticDepth
import cv2
import numpy as np

# =====================================
# CONFIG CONSTANTS
# =====================================
T = 24
FFT_FRAMES = 8
EMBED_DIM = 512
TCN_DIM = 512
DROPOUT = 0.4

# =====================================
# SRM FILTER
# =====================================
class SRMFilter(nn.Module):
    def __init__(self):
        super().__init__()
        kernel = torch.tensor([
            [0, -1, 2, -1, 0],
            [-1, 2, -4, 2, -1],
            [2, -4, 8, -4, 2],
            [-1, 2, -4, 2, -1],
            [0, -1, 2, -1, 0]
        ], dtype=torch.float32) / 8.0
        weight = kernel.view(1, 1, 5, 5).repeat(3, 1, 1, 1)
        self.register_buffer("weight", weight)

    def forward(self, x):
        return F.conv2d(x, self.weight, padding=2, groups=3)

# =====================================
# FREQUENCY ATTENTION (Dùng cho XAI)
# =====================================
class FrequencyAttention(nn.Module):
    def __init__(self, ch, reduction=8):
        super().__init__()
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Linear(ch, ch // reduction),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(ch // reduction, ch),
            nn.Sigmoid()
        )

    def forward(self, x):
        B, C, H, W = x.shape
        w = self.pool(x).view(B, C)
        attn_weights = self.fc(w) # (B, C)
        w_expanded = attn_weights.view(B, C, 1, 1)
        return x * w_expanded, attn_weights

# =====================================
# FREQUENCY-AWARE FFT
# =====================================
class FFTTransform(nn.Module):
    def __init__(self):
        super().__init__()

    def build_masks(self, H, W, device):
        yy, xx = torch.meshgrid(
            torch.arange(H, device=device),
            torch.arange(W, device=device),
            indexing='ij'
        )
        cy, cx = H // 2, W // 2
        dist = ((yy - cy) ** 2 + (xx - cx) ** 2).float().sqrt()
        dist = dist / (dist.max() + 1e-6)
        mid = ((dist >= 0.15) & (dist < 0.45)).float()
        high = (dist >= 0.45).float()
        return mid, high

    def normalize(self, x):
        mean = x.mean(dim=(-2, -1), keepdim=True)
        std = x.std(dim=(-2, -1), keepdim=True)
        std = torch.clamp(std, min=1e-3)
        x = (x - mean) / std
        x = torch.nan_to_num(x, nan=0.0, posinf=5.0, neginf=-5.0)
        return torch.clamp(x, -5.0, 5.0)

    def forward(self, x):
        x = x.float()
        fft = torch.fft.fft2(x, norm="ortho")
        fft = torch.fft.fftshift(fft)
        mag = torch.abs(fft)
        mag = torch.log1p(mag)
        mag = torch.clamp(mag, min=1e-6, max=20.0)
        
        phase = torch.angle(fft) / 3.14159265
        
        B, C, H, W = mag.shape
        mid, high = self.build_masks(H, W, x.device)
        
        mag_mid = mag * mid.unsqueeze(0).unsqueeze(0)
        mag_high = mag * high.unsqueeze(0).unsqueeze(0)
        phase_mid = phase * mid.unsqueeze(0).unsqueeze(0)
        phase_high = phase * high.unsqueeze(0).unsqueeze(0)
        
        freq = torch.cat([mag_mid, mag_high, phase_mid, phase_high], dim=1)
        return self.normalize(freq), mag

# =====================================
# CUSTOM SHALLOW CNN ENCODER
# =====================================
class MSCAFFTShallowEncoder(nn.Module):
    def __init__(self, in_chans=12, out_dim=512):
        super().__init__()
        self.block1 = nn.Sequential(
            nn.Conv2d(in_chans, 32, 3, 1, 1, bias=False),
            nn.GroupNorm(4, 32), nn.GELU(),
            nn.Conv2d(32, 32, 3, 1, 1, bias=False),
            nn.GroupNorm(4, 32), nn.GELU(),
            nn.MaxPool2d(2, 2)
        )
        self.block2 = nn.Sequential(
            nn.Conv2d(32, 64, 3, 1, 1, bias=False),
            nn.GroupNorm(8, 64), nn.GELU(),
            nn.Conv2d(64, 64, 3, 1, 1, bias=False),
            nn.GroupNorm(8, 64), nn.GELU(),
            nn.MaxPool2d(2, 2)
        )
        self.block3 = nn.Sequential(
            nn.Conv2d(64, 128, 3, 1, 1, bias=False),
            nn.GroupNorm(16, 128), nn.GELU(),
            nn.Conv2d(128, 128, 3, 1, 1, bias=False),
            nn.GroupNorm(16, 128), nn.GELU(),
            nn.MaxPool2d(2, 2)
        )
        self.block4 = nn.Sequential(
            nn.Conv2d(128, 256, 3, 1, 1, bias=False),
            nn.GroupNorm(32, 256), nn.GELU(),
            nn.AdaptiveAvgPool2d((1, 1))
        )
        self.head = nn.Sequential(
            nn.LayerNorm(256),
            nn.Dropout(0.3),
            nn.Linear(256, out_dim),
            nn.GELU()
        )

    def forward(self, x, return_feature_map=False):
        x1 = self.block1(x)
        x2 = self.block2(x1)
        x3 = self.block3(x2)
        x4 = self.block4(x3)
        out = self.head(x4.flatten(1))
        if return_feature_map:
            return out, x3 # Tra ve spatial map 16x16 cho XAI
        return out

# =====================================
# ATTENTION POOLING
# =====================================
class AttentionPooling(nn.Module):
    def __init__(self, dim, num_heads=8):
        super().__init__()
        self.query = nn.Parameter(torch.randn(1, 1, dim))
        self.attn = nn.MultiheadAttention(embed_dim=dim, num_heads=num_heads, dropout=0.4, batch_first=True)
        self.norm = nn.LayerNorm(dim)

    def forward(self, x):
        B = x.shape[0]
        q = self.query.expand(B, -1, -1)
        out, _ = self.attn(q, x, x)
        return self.norm(out.squeeze(1))

# =====================================
# MULTI SCALE TEMPORAL BLOCK (TCN)
# =====================================
class MultiScaleTemporalBlock(nn.Module):
    def __init__(self, in_ch, out_ch, dropout=0.4):
        super().__init__()
        dilations = [1, 2, 4, 8]
        branch_ch = out_ch // len(dilations)
        num_groups_branch = 4 if branch_ch % 4 == 0 else 1
        num_groups_out = 8 if out_ch % 8 == 0 else 1

        self.branches = nn.ModuleList([
            nn.Sequential(
                nn.Conv1d(in_ch, branch_ch, kernel_size=3, padding=d, dilation=d),
                nn.GroupNorm(num_groups_branch, branch_ch),
                nn.GELU(),
                nn.Dropout(dropout)
            ) for d in dilations
        ])
        self.fuse = nn.Sequential(
            nn.Conv1d(branch_ch * len(dilations), out_ch, 1),
            nn.GroupNorm(num_groups_out, out_ch),
            nn.GELU(),
            nn.Dropout(dropout)
        )
        self.drop_path = StochasticDepth(p=0.3, mode="row")
        self.residual = nn.Conv1d(in_ch, out_ch, 1) if in_ch != out_ch else nn.Identity()

    def forward(self, x):
        out = torch.cat([b(x) for b in self.branches], dim=1)
        out = self.fuse(out)
        return self.drop_path(out) + self.residual(x)

# =====================================
# FFT STREAM
# =====================================
class FFTStream(nn.Module):
    def __init__(self, embed_dim=512):
        super().__init__()
        self.srm = SRMFilter()
        self.fft = FFTTransform()
        self.freq_attn = FrequencyAttention(12)
        self.encoder = MSCAFFTShallowEncoder(in_chans=12, out_dim=embed_dim)
        self.pool = AttentionPooling(embed_dim)

    def sample_frames(self, x):
        idx = torch.linspace(0, x.shape[1] - 1, steps=FFT_FRAMES, device=x.device).round().long()
        return x[:, idx]

    def forward(self, x):
        x = self.sample_frames(x)
        B, T_idx, C, H, W = x.shape
        x = x.reshape(B * T_idx, C, H, W)
        x = self.srm(x)
        x = F.interpolate(x, size=(128, 128), mode='bilinear', align_corners=False)
        
        with torch.amp.autocast("cuda", enabled=False):
            x, _ = self.fft(x)
            
        x, _ = self.freq_attn(x)
        feat = self.encoder(x).view(B, T_idx, -1)
        feat = F.dropout(feat, p=0.3, training=self.training)
        return self.pool(feat), feat

# =====================================
# TEMPORAL STREAM (UPDATED PIPELINE)
# Pipeline: CNN Feature -> Temporal Attention -> Feature Difference -> TCN
# =====================================
class TemporalStream(nn.Module):
    def __init__(self, embed_dim=512):
        super().__init__()
        self.encoder = MSCAFFTShallowEncoder(in_chans=3, out_dim=embed_dim)
        
        # Self-Attention cap chuoi theo thoi gian
        self.temporal_attn = nn.MultiheadAttention(embed_dim=embed_dim, num_heads=8, dropout=0.3, batch_first=True)
        self.temporal_norm = nn.LayerNorm(embed_dim)
        
        # Feature Difference ket hop 3 luong đặc trưng (Center + Diff1 + Diff2)
        tcn_in_ch = embed_dim * 3 
        
        self.tcn = nn.Sequential(
            MultiScaleTemporalBlock(tcn_in_ch, TCN_DIM, dropout=0.4),
            MultiScaleTemporalBlock(TCN_DIM, TCN_DIM, dropout=0.4),
            MultiScaleTemporalBlock(TCN_DIM, TCN_DIM, dropout=0.4)
        )
        self.pool = AttentionPooling(TCN_DIM)

    def temporal_feature_difference(self, feat):
        """ Tính chênh lệch đặc trưng trên không gian đặc trưng ẩn (Feature Space) """
        center = feat[:, 2:]
        diff1 = feat[:, 2:] - feat[:, 1:-1]
        diff2 = feat[:, 2:] - feat[:, :-2]
        return torch.cat([center, diff1, diff2], dim=-1), diff1, diff2

    def forward(self, x):
        B, T_len, C, H, W = x.shape
        x = x.reshape(B * T_len, C, H, W)
        
        # 1. Trích xuất CNN Feature cho từng frame
        feat = self.encoder(x).view(B, T_len, -1)
        
        # 2. Học Temporal Attention trên toàn bộ sequence
        attn_out, _ = self.temporal_attn(feat, feat, feat)
        feat = self.temporal_norm(feat + attn_out)
        
        # 3. Tính Feature Difference trên các vector đặc trưng
        td_cat, _, _ = self.temporal_feature_difference(feat)
        
        # 4. Đưa qua TCN để khai thác quan hệ thời gian đa tỷ lệ
        feat_tcn = td_cat.transpose(1, 2)
        out = self.tcn(feat_tcn).transpose(1, 2)
        out = F.dropout(out, p=0.3, training=self.training)
        
        return self.pool(out), out

# =====================================
# CROSS ATTENTION FUSION
# =====================================
class CrossAttentionFusion(nn.Module):
    def __init__(self, fft_dim, temp_dim, out_dim=512, num_heads=8):
        super().__init__()
        self.fft_proj = nn.Linear(fft_dim, out_dim)
        self.temp_proj = nn.Linear(temp_dim, out_dim)
        
        self.cross_attn = nn.MultiheadAttention(embed_dim=out_dim, num_heads=num_heads, dropout=0.3, batch_first=True)
        self.norm = nn.LayerNorm(out_dim)
        self.pool = AttentionPooling(out_dim)
        
        self.fusion_mlp = nn.Sequential(
            nn.LayerNorm(out_dim * 2),
            nn.Linear(out_dim * 2, out_dim),
            nn.GELU(),
            nn.Dropout(0.4),
            nn.Linear(out_dim, out_dim)
        )

    def forward(self, fft_embed, temp_embed, fft_seq, temp_seq):
        fft_seq = self.fft_proj(fft_seq)
        temp_seq = self.temp_proj(temp_seq)
        
        attn_out, _ = self.cross_attn(query=temp_seq, key=fft_seq, value=fft_seq)
        fused_seq = self.norm(temp_seq + attn_out)
        seq_pooled = self.pool(fused_seq)
        
        combined = torch.cat([fft_embed, seq_pooled], dim=1)
        return self.fusion_mlp(combined)

# =====================================
# MAIN MODEL WITH REDESIGNED XAI PIPELINE
# =====================================
class DeepfakeFFTTemporalModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fft_stream = FFTStream(EMBED_DIM)
        self.temp_stream = TemporalStream(EMBED_DIM)
        self.fusion = CrossAttentionFusion(EMBED_DIM, TCN_DIM, 512)
        
        self.classifier = nn.Sequential(
            nn.LayerNorm(512),
            nn.Linear(512, 256),
            nn.GELU(),
            nn.Dropout(DROPOUT),
            nn.Linear(256, 1)
        )

    def forward(self, x):
        fft_embed, fft_seq = self.fft_stream(x)
        temp_embed, temp_seq = self.temp_stream(x)
        fused = self.fusion(fft_embed, temp_embed, fft_seq, temp_seq)
        logits = self.classifier(fused)
        
        return {
            "logits": logits,
            "fft_embed": fft_embed,
            "temp_embed": temp_embed,
            "fused": fused
        }

    @torch.no_grad()
    def generate_xai_outputs(self, seq_input, raw_crop_frame):
        """
        XAI Redesign:
        - FFT Stream: [SRM Residual Overlay] + [FFT 2D Spectrum] + [Frequency Attention Weights Bar]
        - Temporal Stream: [Feature Difference Heatmap] + [Temporal Attention Timeline] + [CNN Activation Map]
        """
        self.eval()
        B, T_len, C, H, W = seq_input.shape
        h_c, w_c = (raw_crop_frame.shape[0], raw_crop_frame.shape[1]) if raw_crop_frame is not None else (128, 128)

        # ----------------------------------------------------
        # 1. FFT STREAM PIPELINE VISUALIZATION
        # ----------------------------------------------------
        x_fft_sampled = self.fft_stream.sample_frames(seq_input)
        mid_t_fft = x_fft_sampled.shape[1] // 2
        single_frame_fft = x_fft_sampled[:, mid_t_fft]

        # (A) SRM Residual
        srm_feat = self.fft_stream.srm(single_frame_fft)
        srm_feat_interp = F.interpolate(srm_feat, size=(128, 128), mode='bilinear', align_corners=False)
        srm_map = srm_feat_interp[0].abs().mean(dim=0).cpu().numpy()
        srm_norm = (srm_map - srm_map.min()) / (srm_map.max() - srm_map.min() + 1e-6)
        
        srm_resized = cv2.resize(srm_norm, (w_c, h_c))
        srm_colored = cv2.applyColorMap(np.uint8(255 * srm_resized), cv2.COLORMAP_MAGMA)
        srm_overlay = cv2.addWeighted(raw_crop_frame, 0.4, srm_colored, 0.6, 0) if raw_crop_frame is not None else srm_colored

        # (B) FFT 2D Spectrum
        freq_cat, mag_raw = self.fft_stream.fft(srm_feat_interp)
        mag_np = mag_raw[0].mean(dim=0).cpu().numpy()
        mag_norm = cv2.normalize(mag_np, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
        fft_spectrum = cv2.applyColorMap(mag_norm, cv2.COLORMAP_INFERNO)
        fft_spectrum_resized = cv2.resize(fft_spectrum, (w_c, h_c))

        # Combined FFT Stream Visual
        fft_combined_visual = np.hstack([srm_overlay, fft_spectrum_resized])

        # (C) Frequency Channel Attention Weights
        _, freq_attn_weights = self.fft_stream.freq_attn(freq_cat)
        w_vals = freq_attn_weights[0].cpu().numpy()
        freq_importance = {
            "mag_mid": float(np.mean(w_vals[0:3])),
            "mag_high": float(np.mean(w_vals[3:6])),
            "phase_mid": float(np.mean(w_vals[6:9])),
            "phase_high": float(np.mean(w_vals[9:12]))
        }

        # ----------------------------------------------------
        # 2. TEMPORAL STREAM PIPELINE VISUALIZATION
        # ----------------------------------------------------
        x_flat = seq_input.reshape(B * T_len, C, H, W)
        feat_flat, spatial_fmap = self.temp_stream.encoder(x_flat, return_feature_map=True)
        
        feat_seq = feat_flat.view(B, T_len, -1)
        spatial_fmap = spatial_fmap.view(B, T_len, 128, 16, 16)

        # (A) Temporal Attention Weights & Matrix
        _, attn_weights_matrix = self.temp_stream.temporal_attn(feat_seq, feat_seq, feat_seq)
        timeline_attn = attn_weights_matrix[0].mean(dim=0).cpu().numpy().tolist()

        # (B) Feature Difference calculation
        td_cat, diff1, _ = self.temp_stream.temporal_feature_difference(feat_seq)
        td_mag = diff1[0].abs().mean(dim=-1).cpu().numpy()
        
        # Lay frame co bien do Feature Difference lon nhat
        peak_diff_idx = int(np.argmax(td_mag)) + 1
        peak_fmap = spatial_fmap[0, peak_diff_idx].abs().mean(dim=0).cpu().numpy()
        peak_fmap_norm = (peak_fmap - peak_fmap.min()) / (peak_fmap.max() - peak_fmap.min() + 1e-6)
        
        fmap_resized = cv2.resize(peak_fmap_norm, (w_c, h_c))
        fmap_colored = cv2.applyColorMap(np.uint8(255 * fmap_resized), cv2.COLORMAP_JET)
        spatial_act_overlay = cv2.addWeighted(raw_crop_frame, 0.4, fmap_colored, 0.6, 0) if raw_crop_frame is not None else fmap_colored

        # (C) Motion Difference Visual
        prev_f = seq_input[0, peak_diff_idx - 1].permute(1, 2, 0).cpu().numpy()
        curr_f = seq_input[0, peak_diff_idx].permute(1, 2, 0).cpu().numpy()
        frame_diff = np.abs(curr_f - prev_f).mean(axis=-1)
        frame_diff_norm = (frame_diff - frame_diff.min()) / (frame_diff.max() - frame_diff.min() + 1e-6)
        
        diff_resized = cv2.resize(frame_diff_norm, (w_c, h_c))
        diff_colored = cv2.applyColorMap(np.uint8(255 * diff_resized), cv2.COLORMAP_HOT)
        diff_overlay = cv2.addWeighted(raw_crop_frame, 0.3, diff_colored, 0.7, 0) if raw_crop_frame is not None else diff_colored

        # Combined Temporal Stream Visual
        temporal_combined_visual = np.hstack([diff_overlay, spatial_act_overlay])

        xai_metadata = {
            "freq_importance": freq_importance,
            "timeline_attn": timeline_attn
        }

        return temporal_combined_visual, fft_combined_visual, xai_metadata

# =====================================
# LOSS FUNCTION
# =====================================
class DeepfakeLoss(nn.Module):
    def __init__(self):
        super().__init__()
        self.criterion = nn.BCEWithLogitsLoss()

    def forward(self, outputs, targets):
        targets = targets.float()
        loss = self.criterion(outputs["logits"], targets.view_as(outputs["logits"]))
        return {
            "loss": loss,
            "final_loss": loss,
            "fft_loss": torch.tensor(0.0, device=loss.device),
            "temp_loss": torch.tensor(0.0, device=loss.device)
        }