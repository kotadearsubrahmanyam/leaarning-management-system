# ================== EXISTING IMPORTS ==================
import random
from typing import List, Optional

from fastapi import FastAPI # type: ignore
from pydantic import BaseModel, Field
import torch # type: ignore
import torch.nn.functional as F # type: ignore

# ================== NEW (IMPORTANT) ==================
from dotenv import load_dotenv
load_dotenv()

import os
from groq import Groq # type: ignore

api_key = os.getenv("GROQ_API_KEY", "dummy_key")
client = Groq(api_key=api_key)

# ================== OPTIONAL ==================
try:
    import cv2 # type: ignore
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

app = FastAPI(
    title="LMS AI Microservice",
    version="0.1.0",
)

# ================== MODELS ==================
class RecommendationRequest(BaseModel):
    user_id: str
    completed_courses: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    preferred_levels: List[str] = Field(default_factory=list)

class RecommendationItem(BaseModel):
    course_id: str
    title: str
    score: float
    reason: str

class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[RecommendationItem]

class AnalyticsRequest(BaseModel):
    user_id: str
    recent_activity: List[str] = Field(default_factory=list)
    time_spent_minutes: int = 0
    quiz_scores: Optional[List[float]] = None

class AnalyticsInsight(BaseModel):
    label: str
    value: str
    confidence: float

class AnalyticsResponse(BaseModel):
    user_id: str
    engagement_score: float
    predicted_next_course: str
    insights: List[AnalyticsInsight]

class ChatMessageItem(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    user_id: str
    message: str
    history: List[ChatMessageItem] = Field(default_factory=list)

class ChatResponse(BaseModel):
    user_id: str
    reply: str

# ================== COURSES ==================
COURSES = [
    {
        "id": "course-python-data",
        "title": "Python for Data Science",
        "category": "Data",
        "level": "Beginner",
        "description": "Learn Python, pandas, and data visualization for analytics.",
        "tags": ["python", "data", "analytics"],
    },
    {
        "id": "course-ml-basics",
        "title": "Machine Learning Foundations",
        "category": "AI",
        "level": "Intermediate",
        "description": "Build predictive models using TensorFlow and PyTorch concepts.",
        "tags": ["machine learning", "ai"],
    },
]

# ================== RECOMMENDATION LOGIC (UNCHANGED) ==================
def encode_text(text: str, dimension: int = 128) -> torch.Tensor:
    if not text:
        return torch.zeros(dimension)
    char_codes = [ord(c) for c in text.lower() if ord(c) < 256]
    tensor = torch.tensor(char_codes, dtype=torch.float32)
    tensor = F.pad(tensor, (0, max(0, dimension - tensor.numel())))[:dimension]
    return F.normalize(tensor, dim=0)

def course_embedding(course: dict) -> torch.Tensor:
    text = " ".join([course["title"], course["description"]])
    return encode_text(text)

def build_user_vector(request: RecommendationRequest) -> torch.Tensor:
    return encode_text(" ".join(request.interests))

def rank_recommendations(request: RecommendationRequest):
    return []

# ================== 🚀 NEW REAL AI CHAT ==================
def generate_chat_reply(request: ChatRequest) -> str:
    try:
        print("USER:", request.message)

        if not os.getenv("GROQ_API_KEY"):
            return "⚠️ API key missing. Add GROQ_API_KEY in .env"


        api_messages = [
            {
                "role": "system",
                "content": "You are a powerful AI mentor. Give practical, real-world learning guidance. Avoid generic replies."
            }
        ]

        for msg in request.history:
            api_messages.append({
                "role": msg.role,
                "content": msg.content
            })

        api_messages.append({
            "role": "user",
            "content": request.message
        })

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=api_messages,
            temperature=0.7,
            max_tokens=4000
        )

        reply = response.choices[0].message.content.strip()
        print("AI:", reply)

        return reply

    except Exception as e:
        error_str = str(e)
        print("ERROR:", error_str)
        return f"❌ Error: {error_str}"

# ================== ROUTES ==================
@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    reply = generate_chat_reply(request)
    return ChatResponse(user_id=request.user_id, reply=reply)

# ================== RUN ==================
if __name__ == "__main__":
    import uvicorn # type: ignore
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)