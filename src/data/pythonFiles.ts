export interface PythonFileItem {
  filename: string;
  category: "Activity 2.1 - Core Functions" | "Activity 2.2 - FastAPI Backend" | "Activity 4.2 & 5.2 - Templates & Config";
  description: string;
  code: string;
}

export const PYTHON_FILES: PythonFileItem[] = [
  {
    filename: "app/gemini_flash_generator.py",
    category: "Activity 2.1 - Core Functions",
    description: "Generates concise nutrition and recovery tips using Gemini Flash.",
    code: `import os
import google.generativeai as genai

# Configure Gemini API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def generate_nutrition_tip_with_flash(goal: str) -> str:
    """
    Generate a nutrition or recovery tip using Gemini Flash based on user's fitness goal.
    Args:
        goal (str): User's fitness goal - "weight loss", "muscle gain", or "general fitness".
    Returns:
        str: Generated tip.
    """
    prompt = (
        f"Give one clear, helpful nutrition or recovery tip for someone focused on '{goal}'. "
        "The tip should be practical, friendly, and easy to understand."
    )
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error generating tip: {str(e)}"
`,
  },
  {
    filename: "app/updated_plan.py",
    category: "Activity 2.1 - Core Functions",
    description: "Revises workout plans based on user feedback using Gemini Pro.",
    code: `import os
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-pro")

def update_workout_plan(original_plan: str, user_feedback: str) -> str:
    """
    Use Gemini 1.5 Pro to update the workout plan based on user feedback.
    """
    prompt = f"""
You are a professional fitness trainer assistant.

Here's the original 7-day workout plan:
{original_plan}

User Feedback:
"{user_feedback}"

Based on the feedback, revise the relevant parts of the workout plan. Keep the format and rest of the plan unchanged if not needed.
"""
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error updating plan: {e}"
`,
  },
  {
    filename: "app/gemini_generator.py",
    category: "Activity 2.1 - Core Functions",
    description: "Generates structured 7-day workout plans with warm-up, main workout, and cooldown.",
    code: `import os
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-pro")

def generate_workout_gemini(user_input: dict) -> str:
    prompt = f"""
You are a professional fitness trainer.

Create a personalized, structured 7-day workout plan for someone with the goal of **{user_input['goal']}**, and prefers **{user_input['intensity']} intensity** workouts.

Each day must include:
- A warm-up (5-10 mins)
- Main workout (targeted exercises, sets & reps)
- Cooldown or recovery tip

Format:
Day 1:
Warm-up: ...
Main Workout: ...
Cooldown: ...
(Repeat for Day 2-7)
"""
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error: {e}"
`,
  },
  {
    filename: "app/database.py",
    category: "Activity 2.2 - FastAPI Backend",
    description: "SQLAlchemy models (User, WorkoutPlan) and persistence helper functions.",
    code: `from sqlalchemy import create_engine, Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

DATABASE_URL = "sqlite:///./fitbuddy.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)
    goal = Column(String, nullable=False)
    intensity = Column(String, nullable=False)
    schedule = Column(Integer, default=7)

    workout_plans = relationship("WorkoutPlan", back_populates="user")

class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_plan = Column(Text, nullable=False)
    updated_plan = Column(Text, nullable=True)

    user = relationship("User", back_populates="workout_plans")

Base.metadata.create_all(bind=engine)

def save_user(user_id: int, name: str, age: int, weight: float, goal: str, intensity: str):
    db = SessionLocal()
    existing = db.query(User).filter_by(id=user_id).first()
    if existing:
        existing.name = name
        existing.age = age
        existing.weight = weight
        existing.goal = goal
        existing.intensity = intensity
    else:
        user = User(
            id=user_id,
            name=name,
            age=age,
            weight=weight,
            goal=goal,
            intensity=intensity,
            schedule=7
        )
        db.add(user)
    db.commit()
    db.close()

def save_plan(user_id: int, plan: str):
    db = SessionLocal()
    workout = WorkoutPlan(user_id=user_id, original_plan=plan)
    db.add(workout)
    db.commit()
    db.close()

def update_plan(user_id: int, updated_text: str):
    db = SessionLocal()
    workout = db.query(WorkoutPlan).filter_by(user_id=user_id).first()
    if workout:
        workout.updated_plan = updated_text
        db.commit()
    db.close()

def get_original_plan(user_id: int):
    db = SessionLocal()
    plan = db.query(WorkoutPlan).filter(WorkoutPlan.user_id == user_id).first()
    db.close()
    return plan.original_plan if plan else None

def get_user(user_id: int):
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    db.close()
    return user
`,
  },
  {
    filename: "app/schemas.py",
    category: "Activity 2.2 - FastAPI Backend",
    description: "Pydantic validation schemas for API requests.",
    code: `from pydantic import BaseModel

class WorkoutRequest(BaseModel):
    goal: str
    intensity: str

class UserInput(BaseModel):
    user_id: int
    username: str
    age: int
    weight: float
    goal: str
    intensity: str

class FeedbackRequest(BaseModel):
    feedback: str
`,
  },
  {
    filename: "app/routes.py",
    category: "Activity 2.2 - FastAPI Backend",
    description: "FastAPI routes for HTML form handling and REST API endpoints.",
    code: `import os
from fastapi import APIRouter, Request, Form, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.database import (
    SessionLocal, User, WorkoutPlan,
    save_user, save_plan, update_plan, get_original_plan, get_user
)
from app.gemini_generator import generate_workout_gemini
from app.gemini_flash_generator import generate_nutrition_tip_with_flash
from app.updated_plan import update_workout_plan
from app.schemas import WorkoutRequest, UserInput, FeedbackRequest

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
templates = Jinja2Templates(directory=TEMPLATE_DIR)

# HTML Form Routes
@router.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@router.post("/generate-workout", response_class=HTMLResponse)
def handle_generate_workout(
    request: Request,
    username: str = Form(...),
    user_id: int = Form(...),
    age: int = Form(...),
    weight: float = Form(...),
    goal: str = Form(...),
    intensity: str = Form(...)
):
    save_user(user_id=user_id, name=username, age=age, weight=weight, goal=goal, intensity=intensity)
    plan = generate_workout_gemini({"goal": goal, "intensity": intensity})
    save_plan(user_id=user_id, plan=plan)
    nutrition_tip = generate_nutrition_tip_with_flash(goal=goal)

    return templates.TemplateResponse("result.html", {
        "request": request,
        "username": username,
        "user_id": user_id,
        "age": age,
        "weight": weight,
        "goal": goal,
        "intensity": intensity,
        "workout_plan": plan,
        "nutrition_tip": nutrition_tip
    })

@router.post("/submit-feedback", response_class=HTMLResponse)
def handle_feedback(
    request: Request,
    user_id: int = Form(...),
    feedback: str = Form(...)
):
    user = get_user(user_id)
    original = get_original_plan(user_id)
    if not original:
        raise HTTPException(status_code=404, detail="Original plan not found for this user.")
    
    updated_plan_text = update_workout_plan(original_plan=original, user_feedback=feedback)
    update_plan(user_id=user_id, updated_text=updated_plan_text)
    nutrition_tip = generate_nutrition_tip_with_flash(goal=user.goal if user else "general fitness")

    return templates.TemplateResponse("result.html", {
        "request": request,
        "username": user.name if user else "User",
        "user_id": user_id,
        "age": user.age if user else "",
        "weight": user.weight if user else "",
        "goal": user.goal if user else "",
        "intensity": user.intensity if user else "",
        "workout_plan": updated_plan_text,
        "nutrition_tip": nutrition_tip
    })

@router.get("/view-all-users", response_class=HTMLResponse)
def view_all_users(request: Request):
    db = SessionLocal()
    users = db.query(User).all()
    user_data = []
    for user in users:
        plan = db.query(WorkoutPlan).filter(WorkoutPlan.user_id == user.id).first()
        user_data.append({
            "id": user.id,
            "name": user.name,
            "age": user.age,
            "weight": user.weight,
            "goal": user.goal,
            "intensity": user.intensity,
            "original_plan": plan.original_plan if plan else "N/A",
            "updated_plan": plan.updated_plan if plan and plan.updated_plan else "Not updated"
        })
    db.close()
    return templates.TemplateResponse("all_users.html", {"request": request, "users": user_data})

# REST Endpoints
@router.post("/generate-workout/gemini")
async def generate_gemini_workout(request: WorkoutRequest):
    result = generate_workout_gemini({"goal": request.goal, "intensity": request.intensity})
    return {"model": "gemini-pro", "workout_plan": result}

@router.get("/nutrition-tip")
def get_flash_tip(goal: str):
    tip = generate_nutrition_tip_with_flash(goal)
    return {"goal": goal, "nutrition_tip": tip}

@router.post("/generate-plan")
def generate_plan(user_data: UserInput):
    save_user(user_data.user_id, user_data.username, user_data.age, user_data.weight, user_data.goal, user_data.intensity)
    plan = generate_workout_gemini({"goal": user_data.goal, "intensity": user_data.intensity})
    save_plan(user_data.user_id, plan)
    return {"message": "Workout plan generated and saved successfully!", "workout_plan": plan}

@router.post("/update-plan/{user_id}")
def update_user_plan(user_id: int, data: FeedbackRequest):
    original = get_original_plan(user_id)
    if not original:
        return {"error": "Original plan not found."}
    updated = update_workout_plan(original, data.feedback)
    update_plan(user_id, updated)
    return {"updated_plan": updated}
`,
  },
  {
    filename: "app/main.py",
    category: "Activity 4.2 & 5.2 - Templates & Config",
    description: "FastAPI main application setup and static asset mounting.",
    code: `import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routes import router

app = FastAPI(title="FitBuddy AI Trainer")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.include_router(router)
`,
  },
  {
    filename: "app/templates/index.html",
    category: "Activity 4.2 & 5.2 - Templates & Config",
    description: "Homepage form template styled with gym background.",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FitBuddy - AI Workout Generator</title>
    <link rel="stylesheet" href="/static/style.css">
</head>
<body style="background: url('/static/images/gym-bg.jpg') no-repeat center center fixed; background-size: cover;">
    <div class="form-card">
        <h2>💪 FitBuddy - AI Workout Generator</h2>
        <form action="/generate-workout" method="POST">
            <div class="form-group">
                <label for="username">Name:</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="user_id">User ID:</label>
                <input type="number" id="user_id" name="user_id" required>
            </div>
            <div class="form-group">
                <label for="age">Age:</label>
                <input type="number" id="age" name="age" required>
            </div>
            <div class="form-group">
                <label for="weight">Weight (kg):</label>
                <input type="number" step="0.1" id="weight" name="weight" required>
            </div>
            <div class="form-group">
                <label for="goal">Fitness Goal:</label>
                <input type="text" id="goal" name="goal" placeholder="e.g., weight loss, flexibility" required>
            </div>
            <div class="form-group">
                <label for="intensity">Workout Intensity:</label>
                <select id="intensity" name="intensity" required>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </select>
            </div>
            <button type="submit" class="btn-submit">Generate Plan</button>
        </form>
    </div>
</body>
</html>
`,
  },
  {
    filename: "app/templates/result.html",
    category: "Activity 4.2 & 5.2 - Templates & Config",
    description: "Result page displaying user info, 7-day plan, Flash nutrition tip, and feedback revision form.",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Personalized Workout Plan - FitBuddy</title>
</head>
<body>
    <div class="container">
        <h1>🏋️ Your Personalized Workout Plan</h1>

        <div class="user-info">
            <h2>User Information</h2>
            <p><strong>Name:</strong> {{ username }}</p>
            <p><strong>User ID:</strong> {{ user_id }}</p>
            <p><strong>Age:</strong> {{ age }}</p>
            <p><strong>Weight:</strong> {{ weight }} kg</p>
            <p><strong>Goal:</strong> {{ goal }}</p>
            <p><strong>Intensity:</strong> {{ intensity }}</p>
        </div>

        <h2>Workout Plan</h2>
        <div class="plan-box">
            <pre>{{ workout_plan }}</pre>
        </div>

        <div class="nutrition-card">
            <h3>💡 Nutrition Tip</h3>
            <p>{{ nutrition_tip }}</p>
        </div>

        <div class="feedback-card">
            <h3>📝 Share Your Feedback</h3>
            <form action="/submit-feedback" method="POST">
                <input type="hidden" name="user_id" value="{{ user_id }}">
                <label>Your Feedback:</label>
                <textarea name="feedback" rows="3" placeholder="e.g. Add yoga, include more cardio" required></textarea>
                <button type="submit">Submit Feedback</button>
            </form>
        </div>
    </div>
</body>
</html>
`,
  },
  {
    filename: "app/templates/all_users.html",
    category: "Activity 4.2 & 5.2 - Templates & Config",
    description: "Admin view table displaying all users with original and updated workout plans.",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FitBuddy - All Users & Workout Plans</title>
</head>
<body>
    <h1>📋 FitBuddy - All Users & Workout Plans</h1>
    <table>
        <thead>
            <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Weight (kg)</th>
                <th>Goal</th>
                <th>Intensity</th>
                <th>Original Plan</th>
                <th>Updated Plan</th>
            </tr>
        </thead>
        <tbody>
            {% for user in users %}
            <tr>
                <td>{{ user.id }}</td>
                <td>{{ user.name }}</td>
                <td>{{ user.age }}</td>
                <td>{{ user.weight }}</td>
                <td>{{ user.goal }}</td>
                <td>{{ user.intensity }}</td>
                <td><pre>{{ user.original_plan }}</pre></td>
                <td><pre>{{ user.updated_plan }}</pre></td>
            </tr>
            {% endfor %}
        </tbody>
    </table>
</body>
</html>
`,
  },
];
