from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import numpy as np
import cv2

from quality_check import run_quality_checks
from detector import get_mouth_roi
from segmentation import segment_teeth
from colour_analysis import extract_tooth_colour
from shade_matching import find_closest_shade
from scoring import compute_whiteness_score

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ImagePayload(BaseModel):
    image: str


def decode_base64_image(data_url: str) -> np.ndarray:
    header, encoded = data_url.split(",", 1)
    img_bytes = base64.b64decode(encoded)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)


@app.get("/")
def root():
    return {"status": "ToothCheck backend is running"}


@app.post("/api/analyze")
def analyze(payload: ImagePayload):
    image = decode_base64_image(payload.image)

    # 1. Quality check
    quality = run_quality_checks(image)
    if not quality["passed"]:
        problems = []
        if not quality["brightness"]["ok"]:
            problems.append(quality["brightness"]["message"])
        if not quality["blur"]["ok"]:
            problems.append(quality["blur"]["message"])
        return {"error": True, "messages": problems}

    # 2. Face/mouth detection
    mouth_roi, bbox = get_mouth_roi(image)
    if mouth_roi is None or mouth_roi.size == 0:
        return {"error": True, "messages": ["No face detected. Please face the camera directly."]}

    # 3. Teeth segmentation
    teeth_mask = segment_teeth(mouth_roi)
    if np.count_nonzero(teeth_mask) < 50:
        return {"error": True, "messages": ["Could not detect teeth clearly. Try smiling with teeth visible."]}

    # 4. Colour extraction (LAB)
    lab = extract_tooth_colour(mouth_roi, teeth_mask)
    if lab is None:
        return {"error": True, "messages": ["Colour extraction failed."]}
    L, a, b = lab

    # 5. Shade matching
    shade, delta_e, all_distances = find_closest_shade((L, a, b))
    

    # 6. Whiteness score
    score, category = compute_whiteness_score(L, a, b)

    # 7. Confidence: smaller delta_e = more confident (rough heuristic)
    confidence = max(0.0, min(1.0, 1 - (delta_e / 20)))

    return {
        "shade": shade,
        "whiteness_score": score,
        "yellowing": category,
        "staining": "Low",  # placeholder until Part 11 is implemented
        "confidence": round(confidence, 2),
        "delta_e": round(delta_e, 2),
        "lab": {"L": round(L, 1), "a": round(a, 1), "b": round(b, 1)},
    }