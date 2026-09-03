def compute_whiteness_score(L, a, b):
    """
    Simple project-defined whiteness index, NOT a clinical measurement.
    Higher L (lighter) and lower b (less yellow) -> higher score.
    """
    # Normalize L (typical tooth range ~50-90) to 0-100
    l_component = max(0, min(100, (L - 50) / (90 - 50) * 100))

    # Normalize b (typical tooth yellow range ~10-30, lower = whiter)
    b_component = max(0, min(100, (30 - b) / (30 - 10) * 100))

    score = round(0.6 * l_component + 0.4 * b_component)
    score = max(0, min(100, score))

    if score <= 20:
        category = "Very yellow"
    elif score <= 40:
        category = "Yellow"
    elif score <= 60:
        category = "Moderate"
    elif score <= 80:
        category = "Light"
    else:
        category = "Very light"

    return score, category