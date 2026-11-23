import hashlib
import re
import unicodedata


def normalize_question(text: str) -> str:
    """
    Normalize question text to help identify duplicates.
    """

    text = unicodedata.normalize("NFKC", text)

    text = text.lower()

    text = re.sub(r"\s+", " ", text)

    text = text.strip()

    return text


def generate_fingerprint(text: str) -> str:
    """
    Generate a SHA-256 fingerprint for a question.
    """

    normalized_text = normalize_question(text)

    return hashlib.sha256(
        normalized_text.encode("utf-8")
    ).hexdigest()