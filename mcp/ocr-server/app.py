import os
import re
import sys
import logging
from typing import Dict, Any, Optional
from datetime import datetime

import cv2
import numpy as np
from PIL import Image
import pytesseract
from pypdf import PdfReader
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from mcp.server.fastmcp import FastMCP

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("smartsave-ocr-server")

# Try to find standard Tesseract OCR path on Windows if not in PATH
TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    r"C:\Users\palag\AppData\Local\Programs\Tesseract-OCR\tesseract.exe",
]
for path in TESSERACT_PATHS:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        logger.info(f"Located Tesseract OCR executable at: {path}")
        break

# ── Preprocessing Engine ───────────────────────────────────────────

def preprocess_image(image_path: str) -> np.ndarray:
    """Preprocess image to maximize OCR quality using OpenCV."""
    # Load image in color
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image at path: {image_path}")

    # 1. Grayscale conversion
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2. Noise removal using median blur
    blur = cv2.medianBlur(gray, 3)

    # 3. Thresholding (Binarization using Otsu's thresholding)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    # 4. Normalization
    norm_img = np.zeros((thresh.shape[0], thresh.shape[1]))
    final_img = cv2.normalize(thresh, norm_img, 0, 255, cv2.NORM_MINMAX)

    return final_img

# ── Regex Extractor ───────────────────────────────────────────────

def extract_fields(text: str, default_amount: Optional[float] = None) -> Dict[str, Any]:
    """Parse text using regex filters to extract merchant, date, and amount."""
    fields = {
        "merchant": "Unknown Merchant",
        "date": datetime.today().strftime("%Y-%m-%d"),
        "amount": "0.00"
    }

    if not text:
        if default_amount:
            fields["amount"] = f"{default_amount:.2f}"
        return fields

    # 1. Extract Merchant (common names or first capital line)
    merchants = ["Starbucks", "Target", "Walmart", "Costco", "McDonald's", "Uber", "Amazon", "Chevron", "Shell", "CVS"]
    for m in merchants:
        if re.search(r'\b' + re.escape(m) + r'\b', text, re.IGNORECASE):
            fields["merchant"] = m
            break
    else:
        # Fallback: find first non-empty line of text
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if lines:
            fields["merchant"] = lines[0][:30]

    # 2. Extract Date
    date_patterns = [
        r'\b\d{2}[-/]\d{2}[-/]\d{4}\b',  # DD/MM/YYYY or MM/DD/YYYY
        r'\b\d{4}[-/]\d{2}[-/]\d{2}\b',  # YYYY-MM-DD
        r'\b\d{2} [A-Za-z]{3,9} \d{4}\b',  # DD MMM YYYY
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            fields["date"] = match.group(0)
            break

    # Look for primary total keys first
    amount_match = re.search(
        r'\b(?:total due|total|due|payment|charge)[:\s]*\$?\s*(\d+\.\d{2})',
        text,
        re.IGNORECASE
    )
    if not amount_match:
        # Fallback to secondary subtotal/amount keys
        amount_match = re.search(
            r'\b(?:subtotal|amount)[:\s]*\$?\s*(\d+\.\d{2})',
            text,
            re.IGNORECASE
        )

    if amount_match:
        fields["amount"] = amount_match.group(1)
    else:
        # Fallback to search general floats in text
        floats = re.findall(r'\b\d+\.\d{2}\b', text)
        if floats:
            # Usually the total is the largest amount on the receipt
            try:
                max_float = max(float(f) for f in floats)
                fields["amount"] = f"{max_float:.2f}"
            except ValueError:
                pass
        elif default_amount:
            fields["amount"] = f"{default_amount:.2f}"

    return fields

# ── Unified Document Reader ───────────────────────────────────────

def process_file_path(file_path: str, default_amount: Optional[float] = None, original_name: Optional[str] = None) -> Dict[str, Any]:
    """Inspects file type, runs preprocessing & OCR, and formats JSON outputs."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found at path: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()
    raw_text = ""
    pages_count = 1
    confidence = 0.95

    # CASE A: PDF with a text layer
    if ext == ".pdf":
        reader = PdfReader(file_path)
        pages_count = len(reader.pages)
        raw_text = "\n".join(t for t in (page.extract_text() for page in reader.pages) if t)
        if not raw_text.strip():
            logger.warning("PDF has no text layer (scanned PDF); not supported yet.")

    # CASE B: Images go through OpenCV preprocessing + Tesseract
    elif ext in [".png", ".jpg", ".jpeg"]:
        try:
            preprocessed = preprocess_image(file_path)
            raw_text = pytesseract.image_to_string(Image.fromarray(preprocessed))
            logger.info(f"Tesseract OCR extracted {len(raw_text)} chars from image.")
        except Exception as ocr_err:
            logger.error(f"OCR failed: {ocr_err}")

    # CASE C: Plain-text receipts (used by the sample bills in demo/)
    elif ext == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as fh:
            raw_text = fh.read()

    # No made-up text: if nothing could be read, say so and let the caller reject or retry.
    if not raw_text.strip():
        return {
            "success": False,
            "rawText": "",
            "confidence": 0.0,
            "pages": pages_count,
            "fields": extract_fields("", default_amount),
            "error": "No readable text found in the document.",
        }

    fields = extract_fields(raw_text, default_amount)

    return {
        "success": True,
        "rawText": raw_text,
        "confidence": confidence,
        "pages": pages_count,
        "fields": fields
    }

# ── FastMCP Server Instantiation ──────────────────────────────────

mcp = FastMCP("OCR-Server")

@mcp.tool()
def process_document(file_path: str, default_amount: float = 0.0, original_name: Optional[str] = None) -> dict:
    """Extract text and key fields (merchant, date, amount) from an uploaded document (PDF, PNG, JPEG)."""
    logger.info(f"MCP Tool process_document called for file: {file_path}, original_name: {original_name}")
    try:
        return process_file_path(file_path, default_amount, original_name)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# ── FastAPI REST Layer ────────────────────────────────────────────

app = FastAPI(title="SmartSave OCR Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/ocr")
async def ocr_endpoint(
    file_path: Optional[str] = Form(None),
    default_amount: Optional[float] = Form(None),
    original_name: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Exposes HTTP REST endpoint for document OCR processing."""
    try:
        # Mode 1: Local file path processing
        if file_path:
            logger.info(f"REST API /ocr path call received: {file_path}, original_name: {original_name}")
            return process_file_path(file_path, default_amount, original_name)
        
        # Mode 2: Multipart uploaded file processing
        if file:
            logger.info(f"REST API /ocr multipart file call received: {file.filename}")
            temp_path = os.path.join(os.getcwd(), f"temp_{file.filename}")
            with open(temp_path, "wb") as buffer:
                buffer.write(await file.read())
            
            try:
                result = process_file_path(temp_path, default_amount, file.filename)
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            return result
        
        raise HTTPException(status_code=400, detail="Either file_path or uploaded file must be provided")
    except Exception as e:
        logger.error(f"REST API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "UP", "timestamp": datetime.utcnow().isoformat()}

# Entrypoint for running FastAPI or MCP
if __name__ == "__main__":
    # If standard CLI runs FastAPI uvicorn
    if len(sys.argv) > 1 and sys.argv[1] == "mcp":
        # Launch standard FastMCP over stdio
        logger.info("Starting FastMCP stdio loop...")
        mcp.run()
    else:
        # Default start HTTP REST server
        logger.info("Starting FastAPI HTTP REST server...")
        uvicorn.run(app, host="0.0.0.0", port=5001)
