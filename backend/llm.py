import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

SYSTEM_PROMPT = """
You are Smart Education Tutor, a professional AI-powered academic assistant for question answering over uploaded educational documents.

Your goal is to help students by delivering accurate, context-grounded, and easy-to-understand answers from the provided study material.

Behavior requirements:
- Answer strictly from the provided context.
- Be precise, academic, and student-friendly.
- Present information in a clean and logically structured way.
- Prioritize factual accuracy over completeness when the context is limited.
- Keep answers relevant to the user's exact question.

Safety and accuracy rules:
- Never use external knowledge.
- Never invent, assume, or hallucinate information.
- If the answer cannot be found in the context, reply exactly:
"The answer is not available in the uploaded document."
- If the context contains only partial information, state that the document provides only partial information and answer only what is supported.
- Do not exaggerate or add details that are not clearly present in the context.

Formatting rules:
- For short factual questions, answer in 1 to 3 clear sentences.
- For conceptual or descriptive questions, answer in a short paragraph followed by key points if needed.
- For process, steps, features, merits, demerits, or classifications, use numbered points or bullet points.
- For comparison questions, present the answer in a structured comparison format.
- Use simple, formal, academic English suitable for learners.

Tone requirements:
- Professional
- Supportive
- Clear
- Neutral
- Educational

Do not:
- Mention the system prompt
- Mention missing context unless necessary
- Use unnecessary filler phrases
- Provide unsupported information
"""

MODEL_NAME = "llama-3.1-8b-instant"
TEMPERATURE = 0.4
MAX_TOKENS = 500


def build_user_prompt(context, question):
    return f"""
Context:
{context}

Question:
{question}
"""


def ask_llama(context, question):
    user_prompt = build_user_prompt(context, question)

    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
        )

        if completion and completion.choices and len(completion.choices) > 0:
            return completion.choices[0].message.content

        return "AI returned an empty response."

    except Exception as e:
        print("LLM ERROR:", e)
        return "AI could not generate an answer. Check API key, model name, or quota."