import hashlib
import re


def normalize_question(question_text: str) -> str:
	return re.sub(r"\s+", " ", question_text).strip().lower()


def generate_fingerprint(question_text: str) -> str:
	normalized_text = normalize_question(question_text)
	return hashlib.sha256(normalized_text.encode("utf-8")).hexdigest()
