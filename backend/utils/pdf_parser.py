import fitz  # PyMuPDF
from io import BytesIO

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extracts all text from a PDF file."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n\n"
        return text
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""
