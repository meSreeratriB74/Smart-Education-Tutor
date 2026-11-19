from embeddings import generate_embedding
from database import chunks_collection


def retrieve_relevant_chunks(question, top_k=5):

    query_embedding = generate_embedding(question)

    results = chunks_collection.aggregate([
        {
            "$vectorSearch": {
                "queryVector": query_embedding,
                "path": "embedding",
                "numCandidates": 100,
                "limit": top_k,
                "index": "vector_index"
            }
        }
    ])

    chunks = []

    for doc in results:
        chunks.append(doc["text"])

    return chunks


def get_search_question(question, history):

    # No previous conversation
    if not history:
        return question

    message = question.lower().strip()

    follow_up_phrases = [
        "more",
        "tell me more",
        "explain more",
        "explain further",
        "continue",
        "go on",
        "why",
        "how",
        "give an example",
        "another example",
        "explain again",
        "simplify it",
        "make it simple",
        "what about that",
        "what does it mean",
        "elaborate",
        "in detail"
    ]

    # Check whether the current message is a follow-up
    for phrase in follow_up_phrases:

        if message == phrase or message.startswith(phrase + " "):

            # Find the previous user question
            for item in reversed(history):

                if item["role"] == "user":
                    return item["content"]

    return question
