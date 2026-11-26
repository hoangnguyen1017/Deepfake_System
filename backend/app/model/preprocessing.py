import cv2
import torch
import numpy as np
import time

from retinaface import RetinaFace

T = 24
IMG_SIZE = 128

IMAGENET_MEAN = torch.tensor(
    [0.485, 0.456, 0.406]
).view(1, 3, 1, 1)

IMAGENET_STD = torch.tensor(
    [0.229, 0.224, 0.225]
).view(1, 3, 1, 1)


def detect_face(frame):
    try:
        t0 = time.time()
        faces = RetinaFace.detect_faces(frame)
        print(f"RetinaFace: {time.time() - t0:.2f}s")

        if not isinstance(faces, dict) or len(faces) == 0:
            return None

        face = max(
            faces.values(),
            key=lambda x: (
                (x["facial_area"][2] - x["facial_area"][0])
                *
                (x["facial_area"][3] - x["facial_area"][1])
            )
        )

        x1, y1, x2, y2 = face["facial_area"]

        w = x2 - x1
        h = y2 - y1

        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2

        size = int(max(w, h) * 1.25)

        x1 = max(0, cx - size // 2)
        y1 = max(0, cy - size // 2)
        x2 = min(frame.shape[1], cx + size // 2)
        y2 = min(frame.shape[0], cy + size // 2)

        crop = frame[y1:y2, x1:x2]

        if crop.size == 0:
            return None

        return crop, (x1, y1, x2, y2)

    except Exception as e:
        print("RETINAFACE ERROR:", str(e))
        return None


def crop_with_bbox(frame, bbox):
    x1, y1, x2, y2 = bbox
    crop = frame[y1:y2, x1:x2]

    if crop.size == 0:
        return frame

    return crop


def frame_to_tensor(face):
    face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
    face = cv2.resize(face, (IMG_SIZE, IMG_SIZE))

    face = (
        torch.from_numpy(face)
        .permute(2, 0, 1)
        .float()
        / 255.0
    )

    return face


def process_frame(frame, last_bbox=None):
    result = detect_face(frame)

    if result is not None:
        face, bbox = result
    elif last_bbox is not None:
        face = crop_with_bbox(frame, last_bbox)
        bbox = last_bbox
    else:
        face = frame
        bbox = None

    return frame_to_tensor(face), bbox


def extract_all_frames(video_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print("TOTAL VIDEO FRAMES:", total_frames)

    if total_frames <= 0:
        raise ValueError("Video has no frames")

    # Xác định vị trí bắt đầu của 3 đoạn (Đầu, Giữa, Cuối)
    if total_frames < T * 3:
        starts = [0, max(0, (total_frames - T) // 2), max(0, total_frames - T)]
    else:
        start_head = 0
        start_mid = max(0, (total_frames // 2) - (T // 2))
        start_tail = max(0, total_frames - T)
        starts = [start_head, start_mid, start_tail]

    starts = sorted(list(set(starts)))
    
    all_sequences_frames = []
    preview_frame = None
    preview_bbox = None
    last_bbox = None

    for seq_idx, start_idx in enumerate(starts):
        seq_frames = []
        sample_idxs = list(range(start_idx, min(total_frames, start_idx + T)))

        # KHỞI TẠO 2 BIẾN CHO TỪNG SEQUENCE TẠI ĐÂY
        seq_preview_frame = None
        seq_preview_bbox = None

        print(f"--- EXTRACTING SEQUENCE {seq_idx + 1}: Frames {start_idx + 1} to {start_idx + len(sample_idxs)} ---")

        for i, frame_idx in enumerate(sample_idxs):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret:
                continue

            should_detect = (last_bbox is None or i % 4 == 0)

            if should_detect:
                processed, bbox = process_frame(frame, last_bbox)
            else:
                face = crop_with_bbox(frame, last_bbox)
                processed = frame_to_tensor(face)
                bbox = last_bbox

            if bbox is not None:
                last_bbox = bbox

            seq_frames.append(processed)

            # LƯU FRAME ĐẦU TIÊN CỦA SEQUENCE NÀY ĐỂ LÀM PREVIEW
            if seq_preview_frame is None:
                seq_preview_frame = frame.copy()
                seq_preview_bbox = bbox if bbox is not None else last_bbox

            # Lưu ảnh preview chung toàn bộ video (lấy frame đầu tiên của sequence 1)
            if preview_frame is None:
                preview_frame = frame.copy()
                preview_bbox = bbox if bbox is not None else last_bbox

        # Padding nếu chưa đủ 24 frames
        while len(seq_frames) < T:
            seq_frames.append(seq_frames[-1].clone() if len(seq_frames) > 0 else torch.zeros(3, IMG_SIZE, IMG_SIZE))

        # Lưu thông tin sequence đã bao gồm preview riêng
        all_sequences_frames.append({
            "start_frame": start_idx + 1,
            "end_frame": start_idx + len(sample_idxs),
            "frames": seq_frames,
            "seq_preview_frame": seq_preview_frame,
            "seq_preview_bbox": seq_preview_bbox
        })

    cap.release()

    return all_sequences_frames, total_frames, preview_frame, preview_bbox


def make_sequences(frames):
    seq = torch.stack(frames[:T])
    seq = (seq - IMAGENET_MEAN) / IMAGENET_STD
    return seq