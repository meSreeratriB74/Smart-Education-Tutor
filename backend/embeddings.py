from fastembed import TextEmbedding
model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2")
def generate_embedding(text):
    embedding = list(model.embed([text]))[0].tolist()
    return embedding
