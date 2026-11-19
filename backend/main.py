
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from utils import generate_file_hash
from database import documents_collection, chunks_collection
from pdf_processor import extract_text_from_pdf
from chunker import split_text
from embeddings import generate_embedding
from rag_engine import retrieve_relevant_chunks, get_search_question
from llm import ask_llm

from uuid import uuid4
from typing import Optional

import os


app = FastAPI(
    title="Smart Education Tutor API"
)


# Enable CORS so React frontend can access FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# Store conversation history
conversation_history = {}


@app.get("/")
def home():
    return {
        "message": "Smart Education Tutor Backend Running"
    }


# PDF Upload API
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    # Validate PDF file
    if not file.filename.lower().endswith(".pdf"):
        return {
            "message": "Only PDF files are allowed"
        }

    # Read uploaded file
    file_bytes = await file.read()

    # Generate unique hash
    file_hash = generate_file_hash(file_bytes)

    # Check duplicate PDF
    existing = documents_collection.find_one({
        "file_hash": file_hash
    })

    if existing:
        return {
            "message": "This PDF is already uploaded"
        }

    # Save PDF locally
    filepath = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(filepath, "wb") as f:
        f.write(file_bytes)

    # Extract text from PDF
    text = extract_text_from_pdf(filepath)

    if not text or not text.strip():
        return {
            "message": "Could not extract text from this PDF"
        }

    # Split text into chunks
    chunks = split_text(text)

    if not chunks:
        return {
            "message": "No valid text chunks could be created"
        }

    # Store document metadata
    documents_collection.insert_one({
        "filename": file.filename,
        "file_hash": file_hash,
        "total_chunks": len(chunks)
    })

    # Generate embeddings and store chunks
    for index, chunk in enumerate(chunks):

        embedding = generate_embedding(chunk)

        chunks_collection.insert_one({
            "file_name": file.filename,
            "chunk_index": index,
            "text": chunk,
            "embedding": embedding
        })

    return {
        "message": "PDF processed and stored successfully",
        "filename": file.filename,
        "total_chunks": len(chunks)
    }


# Handle casual conversations
def get_casual_response(question):

    message = question.lower().strip()

    greetings = [
        "hi", "hello", "hey", "hii", "hiii",
        "good morning", "good afternoon",
        "good evening"
    ]

    if message in greetings:
        return "Hello! How can I help you today?"

    if message in ["who are you?", "who are you"]:
        return "I'm Smart Education Tutor, your AI-powered study assistant."

    if message in ["what is your purpose?", "what is your purpose"]:
        return "I'm here to help you understand your study materials and answer your questions."

    if message in ["thank you", "thanks", "thank you!", "thanks!"]:
        return "You're welcome! Happy learning!"

    if message in ["bye", "goodbye", "see you"]:
        return "Goodbye! Happy learning!"

    return None


# Ask Tutor API

@app.get("/ask")
def ask_tutor(
    question: str,
    conversation_id: Optional[str] = None
):

    # Create a new conversation if no ID is provided
    if not conversation_id:
        conversation_id = str(uuid4())

    # Initialize conversation history
    if conversation_id not in conversation_history:
        conversation_history[conversation_id] = []

    history = conversation_history[conversation_id]

    # Handle casual conversations
    casual_response = get_casual_response(question)

    if casual_response:
        answer = casual_response

    else:
        # Understand follow-up questions
        search_question = get_search_question(
            question,
            history
        )

        # Retrieve relevant document chunks
        chunks = retrieve_relevant_chunks(search_question)

        # Handle missing relevant context
        if not chunks:
            answer = "The answer is not available in the uploaded document."

        else:
            # Combine retrieved context
            context = "\n\n".join(chunks)

            # Generate AI answer
            answer = ask_llm(
                context=context,
                question=question,
                history=history
            )

    # Save user message
    history.append({
        "role": "user",
        "content": question
    })

    # Save assistant response
    history.append({
        "role": "assistant",
        "content": answer
    })

    return {
        "conversation_id": conversation_id,
        "question": question,
        "answer": answer
    }
