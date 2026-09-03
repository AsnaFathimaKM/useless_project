import cv2
import numpy as np
from skimage import color


def extract_tooth_colour(mouth_roi_bgr: np.ndarray, teeth_mask: np.ndarray):
    """
    Returns (L, a, b) representative tooth colour, using the median
    of masked pixels to reduce the effect of reflections/noise.
    """
    pixels = mouth_roi_bgr[teeth_mask == 255]

    if len(pixels) == 0:
        return None

    # Convert BGR -> RGB -> normalized [0,1] for skimage
    rgb_pixels = pixels[:, ::-1].astype(np.float64) / 255.0

    # skimage expects an image-shaped array; reshape to (N, 1, 3)
    rgb_pixels_reshaped = rgb_pixels.reshape(-1, 1, 3)
    lab_pixels = color.rgb2lab(rgb_pixels_reshaped).reshape(-1, 3)

    median_lab = np.median(lab_pixels, axis=0)  # [L, a, b]
    return tuple(median_lab)