import cv2
import numpy as np


def segment_teeth(mouth_roi_bgr: np.ndarray) -> np.ndarray:
    """
    Returns a binary mask (same H,W as mouth_roi_bgr) where 255 = likely teeth.
    Heuristic: teeth are bright and low-saturation vs. red/pink lips & gums.
    """
    hsv = cv2.cvtColor(mouth_roi_bgr, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)

    # Teeth: high brightness, low-to-moderate saturation
    mask = cv2.inRange(hsv, (0, 0, 80), (180, 90, 255))

    # Clean up noise
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    return mask