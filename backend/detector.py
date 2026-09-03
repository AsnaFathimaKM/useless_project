import mediapipe as mp
import numpy as np
import cv2

mp_face_mesh = mp.solutions.face_mesh

# MediaPipe Face Mesh landmark indices that outline the lips/mouth region
MOUTH_LANDMARK_IDS = [
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375,
    291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95,
    185, 40, 39, 37, 0, 267, 269, 270, 409,
]

face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
)


def get_mouth_roi(bgr_image: np.ndarray):
    """
    Returns (roi_image, bounding_box) for the mouth region,
    or (None, None) if no face detected.
    """
    rgb = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    if not results.multi_face_landmarks:
        return None, None

    h, w = bgr_image.shape[:2]
    landmarks = results.multi_face_landmarks[0].landmark

    xs, ys = [], []
    for idx in MOUTH_LANDMARK_IDS:
        lm = landmarks[idx]
        xs.append(int(lm.x * w))
        ys.append(int(lm.y * h))

    x_min, x_max = max(min(xs) - 10, 0), min(max(xs) + 10, w)
    y_min, y_max = max(min(ys) - 10, 0), min(max(ys) + 10, h)

    roi = bgr_image[y_min:y_max, x_min:x_max]
    bbox = (x_min, y_min, x_max, y_max)
    return roi, bbox