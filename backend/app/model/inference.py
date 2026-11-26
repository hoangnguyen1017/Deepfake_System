import base64
import time

import cv2
import numpy as np
import torch
# Sửa lại dòng import này ở đầu file inference.py:
from app.database.models import FileUpload, PredictionHistory, ProcessStatus
from app.model.model import DeepfakeFFTTemporalModel
from app.model.preprocessing import extract_all_frames, make_sequences, crop_with_bbox


class DeepfakeDetector:

    def __init__(self):
        self.version = "DeepfakeFFTTemporalModel-v1.0"
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self.load_model()

    def load_model(self):
        model = DeepfakeFFTTemporalModel()

        checkpoint = torch.load(
            r"D:\Deepfake\checkpoints_18\best_model.pth",
            map_location=self.device,
            weights_only=False
        )

        state = checkpoint["model"] if "model" in checkpoint else checkpoint
        model.load_state_dict(state, strict=True)
        model.to(self.device)
        model.eval()

        return model

    def build_preview(self, frame, bbox, prediction, fake_p, real_p):
        if frame is None:
            return None

        img = frame.copy()
        h, w, _ = img.shape
        color = (0, 0, 255) if prediction == "FAKE" else (0, 255, 0)

        # 1. Nếu có BBox -> Cắt rộng ra một chút (Crop with Margin) để phóng to mặt
        if bbox is not None:
            x1, y1, x2, y2 = bbox
            bw, bh = x2 - x1, y2 - y1

            # Thêm Margin 25% xung quanh mặt để khung hình nhìn tự nhiên
            margin_x = int(bw * 0.25)
            margin_y = int(bh * 0.25)

            crop_x1 = max(0, int(x1) - margin_x)
            crop_y1 = max(0, int(y1) - margin_y)
            crop_x2 = min(w, int(x2) + margin_x)
            crop_y2 = min(h, int(y2) + margin_y)

            crop_img = img[crop_y1:crop_y2, crop_x1:crop_x2].copy()

            # Tọa độ BBox mới tương đối với ảnh đã Crop
            new_x1 = int(x1) - crop_x1
            new_y1 = int(y1) - crop_y1
            new_x2 = int(x2) - crop_x1
            new_y2 = int(y2) - crop_y1

            # Vẽ Bounding Box bao quanh mặt trên ảnh cropped
            cv2.rectangle(crop_img, (new_x1, new_y1), (new_x2, new_y2), color, 2)
            display_img = crop_img
        else:
            display_img = img

        # 2. Scale lại kích thước hợp lý (ví dụ: height 300px) để font text không bị vỡ/quá to
        target_h = 300
        dh, dw, _ = display_img.shape
        scale = target_h / float(dh)
        target_w = int(dw * scale)
        resized_img = cv2.resize(display_img, (target_w, target_h))

        # 3. Vẽ Label & % Confidence lên góc
        cv2.putText(resized_img, prediction, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        cv2.putText(resized_img, f"Fake: {fake_p:.1f}%", (10, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        cv2.putText(resized_img, f"Real: {real_p:.1f}%", (10, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

        # Encode sang Base64
        _, buffer = cv2.imencode(".jpg", resized_img)
        return base64.b64encode(buffer).decode("utf-8")
    
    def build_gradcam_base64(self, overlay_frame):
        if overlay_frame is None:
            return None
        _, buffer = cv2.imencode(".jpg", overlay_frame)
        return base64.b64encode(buffer).decode("utf-8")
    
    def build_xai_base64(self, frame_img):
        if frame_img is None:
            return None
        _, buffer = cv2.imencode(".jpg", frame_img)
        return base64.b64encode(buffer).decode("utf-8")
    
    @torch.no_grad()
    def predict_video(self, video_path, db=None, user_id=None, file_id=None, video_name=None):
        start_time = time.time()
        extracted_seqs, total_frames, preview_frame, preview_bbox = extract_all_frames(video_path)
        
        sequences_info = []
        fake_counts = 0
        position_names = ["Đoạn Đầu", "Đoạn Giữa", "Đoạn Cuối"]

        for i, seq_data in enumerate(extracted_seqs):
            chunk_frames = seq_data["frames"]
            seq_preview_frame = seq_data.get("seq_preview_frame")
            seq_preview_bbox = seq_data.get("seq_preview_bbox")
            
            seq = make_sequences(chunk_frames)
            seq_input = seq.unsqueeze(0).to(self.device)

            # 1. Forward Pass
            outputs = self.model(seq_input)
            prob = torch.sigmoid(outputs["logits"]).flatten().item()
            
            seq_pred = "FAKE" if prob >= 0.5 else "REAL"
            if seq_pred == "FAKE":
                fake_counts += 1

            seq_conf = prob if prob >= 0.5 else 1 - prob
            pos_label = position_names[i] if i < len(position_names) else f"Đoạn #{i+1}"

            # 2. Preview Bounding Box
            seq_preview_b64 = self.build_preview(
                seq_preview_frame,
                seq_preview_bbox,
                seq_pred,
                prob * 100,
                (1 - prob) * 100
            )

            # 3. Tạo XAI Outputs theo chuẩn Pipeline mới
            temporal_b64 = None
            fft_map_b64 = None
            freq_importance = None
            timeline_attn = None

            if seq_preview_frame is not None and seq_preview_bbox is not None:
                crop_face = crop_with_bbox(seq_preview_frame, seq_preview_bbox)
                temporal_visual, fft_visual, xai_meta = self.model.generate_xai_outputs(seq_input, crop_face)
                
                temporal_b64 = self.build_xai_base64(temporal_visual)
                fft_map_b64 = self.build_xai_base64(fft_visual)
                freq_importance = xai_meta["freq_importance"]
                timeline_attn = xai_meta["timeline_attn"]

            sequences_info.append({
                "sequence_index": i + 1,
                "position_name": pos_label,
                "start_frame": seq_data["start_frame"],
                "end_frame": seq_data["end_frame"],
                "length": len(chunk_frames),
                "prediction": seq_pred,
                "confidence": round(seq_conf, 4),
                "fake_percent": round(prob * 100, 2),
                "real_percent": round((1 - prob) * 100, 2),
                "preview_image": seq_preview_b64,
                "temporal_image": temporal_b64,
                "fft_map_image": fft_map_b64,
                "freq_importance": freq_importance,  # 👈 Mới: Dữ liệu Frequency Channel Attention
                "timeline_attn": timeline_attn        # 👈 Mới: Dữ liệu Temporal Attention Weights
            })

        # Logic tổng thể: 1 đoạn FAKE -> Video FAKE
        overall_prediction = "FAKE" if fake_counts > 0 else "REAL"
        max_fake_percent = max([s["fake_percent"] for s in sequences_info])
        avg_fake_percent = float(np.mean([s["fake_percent"] for s in sequences_info]))
        
        display_fake_percent = max_fake_percent if overall_prediction == "FAKE" else avg_fake_percent
        display_real_percent = 100.0 - display_fake_percent
        overall_confidence = display_fake_percent / 100.0 if overall_prediction == "FAKE" else display_real_percent / 100.0

        # Ảnh preview mặc định của video lấy từ đoạn 1 (hoặc đoạn có tỷ lệ FAKE cao nhất)
        overall_preview = sequences_info[0]["preview_image"] if sequences_info else None

        processing_time_ms = round((time.time() - start_time) * 1000, 2)

        # Lưu DB...
        if db is not None and user_id is not None:
            bbox_python = [int(val) for val in preview_bbox] if preview_bbox is not None else None

            frame_details = {
                "num_frames_extracted": int(total_frames),
                "num_sequences": len(sequences_info),
                "preview_image": overall_preview,
                "bbox": bbox_python,
                "sequences": sequences_info
            }

            history = PredictionHistory(
                user_id=int(user_id),
                file_id=int(file_id) if file_id is not None else None,
                video_name=video_name or "unknown.mp4",
                label=overall_prediction,
                confidence=float(overall_confidence),
                fake_percent=float(display_fake_percent),
                real_percent=float(display_real_percent),
                model_version=self.version,
                processing_time_ms=float(processing_time_ms),
                frame_analysis_details=frame_details
            )

            db.add(history)
            db.commit()
            db.refresh(history)
            history_id = history.id

        return {
            "prediction_id": history_id,
            "file_id": file_id,
            "prediction": overall_prediction,
            "confidence": round(overall_confidence, 4),
            "fake_percent": round(display_fake_percent, 2),
            "real_percent": round(display_real_percent, 2),
            "model_version": self.version,
            "processing_time_ms": processing_time_ms,
            "preview_image": overall_preview,
            "total_frames": total_frames,
            "num_sequences": len(sequences_info),
            "sequences": sequences_info
        }
detector = DeepfakeDetector()