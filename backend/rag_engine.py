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