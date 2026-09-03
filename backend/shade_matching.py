import json
import os
import numpy as np
from skimage import color

SHADES_PATH = os.path.join(os.path.dirname(__file__), "data", "shades.json")

with open(SHADES_PATH) as f:
    SHADE_DB = json.load(f)


def lab_to_skimage_format(L, a, b):
    """skimage's deltaE functions expect Lab arrays shaped (...,3)."""
    return np.array([L, a, b])


def find_closest_shade(user_lab):
    """
    user_lab: (L, a, b) tuple
    Returns (best_shade_name, delta_e, all_distances_dict)
    """
    user_arr = np.array(user_lab).reshape(1, 1, 3)

    distances = {}
    for shade_name, lab in SHADE_DB.items():
        ref_arr = np.array([lab["L"], lab["a"], lab["b"]]).reshape(1, 1, 3)
        delta_e = color.deltaE_ciede2000(user_arr, ref_arr)[0][0]
        distances[shade_name] = float(delta_e)

    best_shade = min(distances, key=distances.get)
    return best_shade, distances[best_shade], distances