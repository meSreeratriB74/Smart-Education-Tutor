from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from utils import generate_file_hash
from database import documents_collection, chunks_collection
from pdf_processor import extract_text_from_pdf
from chunker import split_text
from embeddings import generate_embedding
from rag_engine import retrieve_relevant_chunks
from llm import ask_llama

import os

app = FastAPI()

# ✅ Enable CORS so React frontend can access FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.get("/")
def home():
    return {"message": "Smart Education Tutor Backend Running"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    file_bytes = await file.read()

    file_hash = generate_file_hash(file_bytes)

    existing = documents_collection.find_one({"file_hash": file_hash})

    if existing:
        return {"message": "This document is already uploaded"}

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(filepath, "wb") as f:
        f.write(file_bytes)

    documents_collection.insert_one({
        "filename": file.filename,
        "file_hash": file_hash
    })

    # Extract text from PDF
    text = extract_text_from_pdf(filepath)

    # Split text into chunks
    chunks = split_text(text)

    # Generate embeddings and store in MongoDB
    for chunk in chunks:
        embedding = generate_embedding(chunk)

        chunks_collection.insert_one({
    "file_name": file.filename,
    "text": chunk,
    "embedding": embedding
})

    return {"message": "PDF processed and stored successfully"}


@app.get("/ask")
def ask_tutor(question: str):
    chunks = retrieve_relevant_chunks(question)

    context = "\n".join(chunks)

    answer = ask_llama(context, question)

    return {
        "question": question,
        "answer": answer
    }