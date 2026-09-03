import cv2
import numpy as np
from skimage import color


def extract_tooth_colour(
    mouth_roi_bgr: np.ndarray,
    teeth_mask: np.ndarray
):
    """
    Extracts a robust representative LAB colour from the
    detected tooth pixels, plus the real spread (std) of that
    same stable pixel set - used downstream only to report an
    honest measurement confidence, never to alter the colour
    reading itself.

    The method:
    1. Uses only pixels inside the tooth mask.
    2. Removes extremely dark and extremely bright pixels.
    3. Removes colour outliers.
    4. Uses a central percentile range instead of blindly
       trusting every detected pixel.
    5. Returns the median LAB value and its pixel-spread (std).

    This is intended for the ToothCheck demo and is NOT
    a clinical dental colour measurement.

    Returns:
        (L, a, b), (std_L, std_a, std_b)
        or (None, None) if extraction failed.
    """

    if (
        mouth_roi_bgr is None
        or mouth_roi_bgr.size == 0
        or teeth_mask is None
    ):
        return None, None

    # ---------------------------------------------------------
    # MAKE SURE MASK SIZE MATCHES IMAGE
    # ---------------------------------------------------------

    if teeth_mask.shape[:2] != mouth_roi_bgr.shape[:2]:
        teeth_mask = cv2.resize(
            teeth_mask,
            (
                mouth_roi_bgr.shape[1],
                mouth_roi_bgr.shape[0]
            ),
            interpolation=cv2.INTER_NEAREST
        )

    # ---------------------------------------------------------
    # GET MASKED PIXELS
    # ---------------------------------------------------------

    mask = teeth_mask > 0

    pixels = mouth_roi_bgr[mask]

    if len(pixels) < 20:
        return None, None

    # ---------------------------------------------------------
    # REMOVE EXTREME CAMERA VALUES
    # ---------------------------------------------------------
    #
    # Very dark pixels are usually shadows/background.
    # Very bright pixels can be specular reflections.
    #

    brightness = np.mean(
        pixels.astype(np.float32),
        axis=1
    )

    lower_brightness = np.percentile(
        brightness,
        5
    )

    upper_brightness = np.percentile(
        brightness,
        95
    )

    valid = (
        (brightness >= lower_brightness)
        &
        (brightness <= upper_brightness)
    )

    pixels = pixels[valid]

    if len(pixels) < 20:
        return None, None

    # ---------------------------------------------------------
    # BGR -> RGB
    # ---------------------------------------------------------

    rgb_pixels = (
        pixels[:, ::-1]
        .astype(np.float64)
        / 255.0
    )

    # ---------------------------------------------------------
    # RGB -> LAB
    # ---------------------------------------------------------

    rgb_pixels_reshaped = (
        rgb_pixels.reshape(-1, 1, 3)
    )

    lab_pixels = color.rgb2lab(
        rgb_pixels_reshaped
    ).reshape(-1, 3)

    # ---------------------------------------------------------
    # REMOVE LAB OUTLIERS
    # ---------------------------------------------------------
    #
    # Instead of allowing a small unusual region to influence
    # the result, keep the central 80% of the LAB distribution.
    #

    lab_median = np.median(
        lab_pixels,
        axis=0
    )

    distances = np.linalg.norm(
        lab_pixels - lab_median,
        axis=1
    )

    distance_limit = np.percentile(
        distances,
        80
    )

    stable_pixels = lab_pixels[
        distances <= distance_limit
    ]

    if len(stable_pixels) < 10:
        stable_pixels = lab_pixels

    # ---------------------------------------------------------
    # FINAL ROBUST COLOUR
    # ---------------------------------------------------------

    representative_lab = np.median(
        stable_pixels,
        axis=0
    )

    L = float(representative_lab[0])
    a = float(representative_lab[1])
    b = float(representative_lab[2])

    # ---------------------------------------------------------
    # REAL PIXEL SPREAD (for honest confidence reporting only)
    # ---------------------------------------------------------

    std_lab = np.std(
        stable_pixels,
        axis=0
    )

    std_L = float(std_lab[0])
    std_a = float(std_lab[1])
    std_b = float(std_lab[2])

    return (L, a, b), (std_L, std_a, std_b)