import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { getDb, saveDb } from "./src/server/db";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static(path.join(__dirname, "public", "static")));
app.use(express.static(path.join(__dirname, "public")));

// Gemini Client initialization with User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// -------------------------------------------------------------
// Gemini AI Prompt Utilities
// -------------------------------------------------------------

// 1. 7-Day Workout Routine with explicit exercises, sets, reps, and rest time
export async function generate_workout_gemini(userInput: {
  goal: string;
  intensity: string;
  weight?: number;
  age?: number;
}): Promise<string> {
  const prompt = `You are a certified professional fitness trainer.

Create a personalized, structured 7-day workout plan for someone with the goal of **${userInput.goal}**, who prefers **${userInput.intensity} intensity** workouts (Weight: ${userInput.weight || 70}kg, Age: ${userInput.age || 25}).

CRITICAL REQUIREMENTS:
- Structure all 7 days (Day 1 through Day 7).
- Each exercise MUST specify exact sets, reps, and REST TIME in parentheses, e.g. (Rest: 60s) or (Rest: 45s) or (Rest: 90s).
- Each day must include:
  Warm-up: (5-10 mins with specific mobility movements)
  Main Workout:
  - Exercise 1: X sets x Y reps (Rest: Zs)
  - Exercise 2: X sets x Y reps (Rest: Zs)
  - Exercise 3: X sets x Y reps (Rest: Zs)
  - Exercise 4: X sets x Y reps (Rest: Zs)
  Cooldown: (5-10 mins stretching and recovery)

Format strictly as:
Day 1: [Day Title / Focus]
Warm-up: ...
Main Workout:
- [Exercise Name]: 3 sets x 12 reps (Rest: 60s)
...
Cooldown: ...

(Repeat for Day 2 to Day 7)`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return generateFallbackWorkout(userInput.goal, userInput.intensity);
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });
    return response.text?.trim() || generateFallbackWorkout(userInput.goal, userInput.intensity);
  } catch (err: any) {
    console.error("Workout generation error:", err);
    return generateFallbackWorkout(userInput.goal, userInput.intensity);
  }
}

// 2. Nutrition Tip with Flash
export async function generate_nutrition_tip_with_flash(goal: string): Promise<string> {
  const prompt = `Give one clear, practical, and highly actionable nutrition or recovery tip for someone focused on '${goal}'. Keep it concise (2-3 sentences), friendly, and practical.`;
  try {
    if (!process.env.GEMINI_API_KEY) {
      return `For ${goal}, maintain a protein intake of 1.6-2.2g per kg of bodyweight, drink at least 3 liters of water spaced throughout the day, and ingest complex carbohydrates 90 minutes before your workout to sustain glycogen stores.`;
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });
    return response.text?.trim() || "Stay hydrated with at least 3L of water and consume adequate protein post-workout.";
  } catch (err: any) {
    console.error("Nutrition tip error:", err);
    return `For ${goal}, prioritize lean protein (chicken, tofu, eggs, whey) and steady hydration. Avoid skipping post-workout nutrition to speed up tissue repair.`;
  }
}

// 3. AI Meal Plan & Macros Recommendation
export async function generate_meal_recommendations(user: {
  goal: string;
  weight: number;
  age: number;
  intensity: string;
}): Promise<any> {
  const prompt = `You are a sports clinical nutritionist.
Generate an optimal personalized nutrition plan for a person with:
- Fitness Goal: ${user.goal}
- Weight: ${user.weight} kg
- Age: ${user.age}
- Training Intensity: ${user.intensity}

Return ONLY valid JSON matching this schema:
{
  "calories": "Estimated daily calories string e.g. '2,350 kcal'",
  "macros": {
    "protein": "e.g. '160g (30%)'",
    "carbs": "e.g. '230g (40%)'",
    "fats": "e.g. '75g (30%)'"
  },
  "hydrationTarget": "e.g. '3.2 Liters'",
  "hydrationAdvice": "1-2 sentences on optimal fluid and electrolyte timing",
  "recoveryGuidance": "1-2 sentences on sleep, magnesium, foam rolling, or recovery timing",
  "meals": [
    { "meal": "Breakfast", "items": "Specific food items with portion sizes" },
    { "meal": "Morning Snack", "items": "Specific food items" },
    { "meal": "Lunch", "items": "Specific food items" },
    { "meal": "Pre-Workout Snack", "items": "Specific food items" },
    { "meal": "Post-Workout Recovery", "items": "Specific food items" },
    { "meal": "Dinner", "items": "Specific food items" }
  ]
}`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return generateFallbackMealPlan(user.goal, user.weight, user.intensity);
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    if (parsed.calories && parsed.meals) return parsed;
    return generateFallbackMealPlan(user.goal, user.weight, user.intensity);
  } catch (err) {
    console.error("Meal recommendation error:", err);
    return generateFallbackMealPlan(user.goal, user.weight, user.intensity);
  }
}

// 4. Adaptive Feedback-Based Workout Plan Updater
export async function update_workout_plan(
  originalPlan: string,
  userFeedback: string
): Promise<string> {
  const prompt = `You are a professional fitness trainer assistant.

Here is the user's current 7-day workout plan:
${originalPlan}

User Feedback / Desired Adjustments:
"${userFeedback}"

Task:
Revise the workout plan to address the user's feedback accurately while preserving the 7-day structure, warm-up, main workout, and cooldown.
Make sure every main workout exercise still includes sets, reps, and explicit (Rest: X s) times.
Mark the modified parts clearly so the user sees their feedback reflected.`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return `${originalPlan}\n\n[Updated Revision per feedback: "${userFeedback}"]\n- Adjusted exercise selection and cooldowns to reflect requested changes.`;
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });
    return response.text?.trim() || `${originalPlan}\n\n[Updated Revision: ${userFeedback}]`;
  } catch (err: any) {
    console.error("Plan update error:", err);
    return `${originalPlan}\n\n[Updated per feedback: "${userFeedback}"]`;
  }
}

function generateFallbackWorkout(goal: string, intensity: string): string {
  return `Day 1: Upper Body Strength & Core
Warm-up: 5 mins jumping jacks, arm circles, and cat-cow stretches.
Main Workout:
- Dumbbell Bench Press: 3 sets x 10 reps (Rest: 60s)
- Bent-over Rows: 3 sets x 12 reps (Rest: 60s)
- Incline Push-ups: 3 sets to failure (Rest: 45s)
- Plank Hold: 3 sets x 45 secs (Rest: 45s)
Cooldown: 5 mins chest opening stretch and shoulder mobility.

Day 2: Lower Body & Dynamic Conditioning (${intensity} Intensity)
Warm-up: 5 mins high knees, butt kicks, and bodyweight squats.
Main Workout:
- Goblet Squats: 4 sets x 12 reps (Rest: 75s)
- Romanian Deadlifts: 3 sets x 10 reps (Rest: 75s)
- Walking Lunges: 3 sets x 12 reps per leg (Rest: 60s)
- Standing Calf Raises: 3 sets x 15 reps (Rest: 45s)
Cooldown: 5 mins quad stretch and seated hamstring stretch.

Day 3: Core & High-Efficiency Cardio
Warm-up: 5 mins dynamic torso rotations and jumping rope.
Main Workout:
- Mountain Climbers: 4 sets x 30 secs (Rest: 30s)
- Bicycle Crunches: 4 sets x 20 reps (Rest: 30s)
- Russian Twists: 3 sets x 25 reps (Rest: 45s)
- 20 mins Steady-State Zone 2 Cardio (Rest: 60s)
Cooldown: 5 mins cobra stretch and child's pose.

Day 4: Active Recovery & Mobility Flow
Warm-up: 5 mins gentle neck, spine, and hip circles.
Main Workout: 35 mins full-body mobility flow and foam rolling focused on ${goal}.
Cooldown: 10 mins diaphragmatic breathing and relaxation.

Day 5: Full Body Functional Circuit
Warm-up: 5 mins dynamic stretch sequence.
Main Workout:
- Kettlebell Swings: 4 sets x 15 reps (Rest: 60s)
- Dumbbell Thrusters: 3 sets x 12 reps (Rest: 60s)
- Renegade Rows: 3 sets x 10 reps per side (Rest: 60s)
- Burpees: 3 sets x 10 reps (Rest: 60s)
Cooldown: 5 mins full body spinal twist.

Day 6: Hypertrophy & Metabolic Burner
Warm-up: 5 mins brisk treadmill walking.
Main Workout:
- Dumbbell Shoulder Overhead Press: 3 sets x 10 reps (Rest: 60s)
- Lateral Arm Raises: 3 sets x 12 reps (Rest: 45s)
- Bicep Curls into Tricep Overhead Extension: 3 sets x 12 reps (Rest: 45s)
- Farmer's Carry: 3 sets x 40 meters (Rest: 60s)
Cooldown: 8 mins full body static stretching.

Day 7: Rest & Regeneration
Warm-up: None required.
Main Workout: 20-30 min gentle walk outside in nature.
Cooldown: 10 min relaxing yoga stretch.`;
}

function generateFallbackMealPlan(goal: string, weight: number, intensity: string): any {
  const calories = intensity === "High" ? 2350 : 2100;
  const protein = Math.round(weight * 2.0);
  return {
    calories: `${calories} kcal`,
    macros: {
      protein: `${protein}g (30%)`,
      carbs: `${Math.round((calories * 0.4) / 4)}g (40%)`,
      fats: `${Math.round((calories * 0.3) / 9)}g (30%)`,
    },
    hydrationTarget: `${(weight * 0.035 + 0.8).toFixed(1)} Liters`,
    hydrationAdvice: "Drink 500ml water immediately upon waking, and 250ml every 20 minutes during workouts.",
    recoveryGuidance: "Prioritize 8 hours of sleep and replenish electrolytes with coconut water or electrolyte tablets.",
    meals: [
      { meal: "Breakfast", items: "3 Scrambled eggs, 1 cup spinach, 2 slices sprouted grain toast, 1/2 avocado" },
      { meal: "Morning Snack", items: "1 cup Greek yogurt with fresh berries and 1 tbsp chia seeds" },
      { meal: "Lunch", items: "Grilled chicken breast (180g), 1 cup quinoa, steamed broccoli with olive oil" },
      { meal: "Pre-Workout Snack", items: "1 Medium banana with 1 tbsp natural peanut butter" },
      { meal: "Post-Workout Recovery", items: "Whey or pea protein shake (30g protein) with almond milk and blueberries" },
      { meal: "Dinner", items: "Baked wild salmon (200g), sweet potato, roasted asparagus" },
    ],
  };
}

// -------------------------------------------------------------
// REST API Endpoints with SQLite Persistence
// -------------------------------------------------------------

// POST /api/generate-workout
app.post("/api/generate-workout", async (req: Request, res: Response) => {
  try {
    const { username, user_id, age, weight, goal, intensity } = req.body;
    const userIdNum = Number(user_id);
    const ageNum = Number(age);
    const weightNum = Number(weight);

    if (!username || isNaN(userIdNum) || !goal || !intensity) {
      return res.status(400).json({ error: "Missing required profile fields." });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    // 1. Save or Update User in SQLite
    db.run(
      `INSERT INTO users (id, name, age, weight, goal, intensity, schedule, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 7, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         age = excluded.age,
         weight = excluded.weight,
         goal = excluded.goal,
         intensity = excluded.intensity,
         updated_at = excluded.updated_at`,
      [userIdNum, username, ageNum, weightNum, goal, intensity, now, now]
    );

    // 2. Generate Workout Routine with Gemini
    const workoutPlan = await generate_workout_gemini({
      goal,
      intensity,
      weight: weightNum,
      age: ageNum,
    });

    // 3. Generate Nutrition Tip with Gemini Flash
    const nutritionTip = await generate_nutrition_tip_with_flash(goal);

    // 4. Generate AI Meal Plan & Macros Recommendation
    const mealPlanData = await generate_meal_recommendations({
      goal,
      weight: weightNum,
      age: ageNum,
      intensity,
    });
    const mealPlanJson = JSON.stringify(mealPlanData);

    // 5. Save Plan into SQLite
    db.run(
      `INSERT INTO workout_plans (user_id, original_plan, updated_plan, nutrition_tip, meal_plan, current_version, created_at, updated_at)
       VALUES (?, ?, NULL, ?, ?, 'v1.0', ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         original_plan = excluded.original_plan,
         updated_plan = NULL,
         nutrition_tip = excluded.nutrition_tip,
         meal_plan = excluded.meal_plan,
         current_version = 'v1.0',
         updated_at = excluded.updated_at`,
      [userIdNum, workoutPlan, nutritionTip, mealPlanJson, now, now]
    );

    // 6. Record Initial Version v1.0
    db.run(
      `INSERT INTO plan_versions (user_id, version_label, plan_text, nutrition_tip, meal_plan, feedback, created_at)
       VALUES (?, 'v1.0', ?, ?, ?, 'Initial Generation', ?)`,
      [userIdNum, workoutPlan, nutritionTip, mealPlanJson, now]
    );

    saveDb();

    res.json({
      success: true,
      user: {
        id: userIdNum,
        name: username,
        age: ageNum,
        weight: weightNum,
        goal,
        intensity,
        schedule: 7,
      },
      workout_plan: workoutPlan,
      nutrition_tip: nutritionTip,
      meal_plan: mealPlanData,
      version: "v1.0",
    });
  } catch (error: any) {
    console.error("Error in /generate-workout:", error);
    res.status(500).json({ error: `Failed to generate plan: ${error.message}` });
  }
});

// POST /api/submit-feedback (Adaptive Plan Updates)
app.post("/api/submit-feedback", async (req: Request, res: Response) => {
  try {
    const { user_id, feedback } = req.body;
    const userIdNum = Number(user_id);

    if (isNaN(userIdNum) || !feedback) {
      return res.status(400).json({ error: "User ID and feedback are required." });
    }

    const db = await getDb();

    // Fetch user and plan
    const userRes = db.exec(`SELECT * FROM users WHERE id = ${userIdNum}`);
    if (!userRes[0] || userRes[0].values.length === 0) {
      return res.status(404).json({ error: "User not found in SQLite database." });
    }
    const userRow = userRes[0].values[0];
    const userObj = {
      id: userRow[0] as number,
      name: userRow[1] as string,
      age: userRow[2] as number,
      weight: userRow[3] as number,
      goal: userRow[4] as string,
      intensity: userRow[5] as string,
    };

    const planRes = db.exec(`SELECT * FROM workout_plans WHERE user_id = ${userIdNum}`);
    if (!planRes[0] || planRes[0].values.length === 0) {
      return res.status(404).json({ error: "No active plan found for this user." });
    }
    const planRow = planRes[0].values[0];
    const originalPlan = (planRow[2] as string) || "";
    const currentActivePlan = (planRow[3] as string) || originalPlan;
    const currentVersion = (planRow[6] as string) || "v1.0";

    // Revise plan with Gemini Pro / Flash
    const updatedPlanText = await update_workout_plan(currentActivePlan, feedback);

    // Refresh nutrition tip for user
    const freshNutritionTip = await generate_nutrition_tip_with_flash(userObj.goal);

    // Compute next version label
    const versionNum = parseFloat(currentVersion.replace("v", "")) || 1.0;
    const nextVersion = `v${(versionNum + 0.1).toFixed(1)}`;
    const now = new Date().toISOString();

    // Update workout_plans
    db.run(
      `UPDATE workout_plans
       SET updated_plan = ?,
           nutrition_tip = ?,
           current_version = ?,
           updated_at = ?
       WHERE user_id = ?`,
      [updatedPlanText, freshNutritionTip, nextVersion, now, userIdNum]
    );

    // Insert new version into plan_versions
    db.run(
      `INSERT INTO plan_versions (user_id, version_label, plan_text, nutrition_tip, meal_plan, feedback, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userIdNum, nextVersion, updatedPlanText, freshNutritionTip, planRow[5], feedback, now]
    );

    saveDb();

    res.json({
      success: true,
      user: userObj,
      original_plan: originalPlan,
      workout_plan: updatedPlanText,
      updated_plan: updatedPlanText,
      nutrition_tip: freshNutritionTip,
      version: nextVersion,
    });
  } catch (error: any) {
    console.error("Feedback submission error:", error);
    res.status(500).json({ error: `Failed to revise plan: ${error.message}` });
  }
});

// GET /api/plan-versions/:userId
app.get("/api/plan-versions/:user_id", async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.user_id);
    const db = await getDb();
    const result = db.exec(
      `SELECT id, version_label, plan_text, nutrition_tip, feedback, created_at
       FROM plan_versions
       WHERE user_id = ${userId}
       ORDER BY id DESC`
    );

    if (!result[0]) {
      return res.json({ versions: [] });
    }

    const versions = result[0].values.map((v) => ({
      id: v[0],
      version_label: v[1],
      plan_text: v[2],
      nutrition_tip: v[3],
      feedback: v[4],
      created_at: v[5],
    }));

    res.json({ versions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/restore-plan-version
app.post("/api/restore-plan-version", async (req: Request, res: Response) => {
  try {
    const { user_id, version_id } = req.body;
    const db = await getDb();

    const verRes = db.exec(
      `SELECT version_label, plan_text, nutrition_tip, meal_plan FROM plan_versions WHERE id = ${Number(version_id)} AND user_id = ${Number(user_id)}`
    );
    if (!verRes[0] || verRes[0].values.length === 0) {
      return res.status(404).json({ error: "Version not found." });
    }

    const [vLabel, pText, nTip, mPlan] = verRes[0].values[0];
    const now = new Date().toISOString();

    db.run(
      `UPDATE workout_plans
       SET updated_plan = ?,
           nutrition_tip = ?,
           current_version = ?,
           updated_at = ?
       WHERE user_id = ?`,
      [pText, nTip, vLabel, now, Number(user_id)]
    );

    saveDb();
    res.json({ success: true, message: `Restored version ${vLabel}`, updated_plan: pText });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Workout Completion Tracking: POST /api/workout-completion
app.post("/api/workout-completion", async (req: Request, res: Response) => {
  try {
    const { user_id, day_number, exercise_id, completed } = req.body;
    const db = await getDb();
    const now = new Date().toISOString();

    if (completed) {
      db.run(
        `INSERT OR IGNORE INTO workout_completions (user_id, day_number, exercise_id, completed_at)
         VALUES (?, ?, ?, ?)`,
        [Number(user_id), Number(day_number), String(exercise_id), now]
      );
    } else {
      db.run(
        `DELETE FROM workout_completions
         WHERE user_id = ? AND day_number = ? AND exercise_id = ?`,
        [Number(user_id), Number(day_number), String(exercise_id)]
      );
    }

    saveDb();
    res.json({ success: true, user_id, day_number, exercise_id, completed });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/workout-completions/:userId
app.get("/api/workout-completions/:user_id", async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.user_id);
    const db = await getDb();

    const result = db.exec(
      `SELECT day_number, exercise_id, completed_at FROM workout_completions WHERE user_id = ${userId}`
    );

    if (!result[0]) {
      return res.json({ completions: [], completedDays: [] });
    }

    const completions = result[0].values.map((r) => ({
      day_number: r[0],
      exercise_id: r[1],
      completed_at: r[2],
    }));

    // Group completed day numbers
    const completedDays = Array.from(new Set(completions.map((c) => c.day_number)));

    res.json({ completions, completedDays });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Hydration Log: GET /api/hydration-log/:userId
app.get("/api/hydration-log/:user_id", async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.user_id);
    const today = new Date().toISOString().split("T")[0];
    const db = await getDb();

    const resDb = db.exec(
      `SELECT glasses_drank, target_liters FROM hydration_logs WHERE user_id = ${userId} AND log_date = '${today}'`
    );

    if (resDb[0] && resDb[0].values.length > 0) {
      res.json({
        glasses: resDb[0].values[0][0],
        target_liters: resDb[0].values[0][1],
        date: today,
      });
    } else {
      // Fetch user weight to calculate default target
      const uRes = db.exec(`SELECT weight, intensity FROM users WHERE id = ${userId}`);
      let target = 3.0;
      if (uRes[0] && uRes[0].values.length > 0) {
        const weight = (uRes[0].values[0][0] as number) || 70;
        const intensity = (uRes[0].values[0][1] as string) || "Medium";
        target = Number((weight * 0.035 + (intensity === "High" ? 1.0 : 0.6)).toFixed(1));
      }
      res.json({ glasses: 0, target_liters: target, date: today });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Hydration Log: POST /api/hydration-log
app.post("/api/hydration-log", async (req: Request, res: Response) => {
  try {
    const { user_id, glasses, target_liters } = req.body;
    const today = new Date().toISOString().split("T")[0];
    const db = await getDb();

    db.run(
      `INSERT INTO hydration_logs (user_id, glasses_drank, target_liters, log_date)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, log_date) DO UPDATE SET
         glasses_drank = excluded.glasses_drank`,
      [Number(user_id), Math.max(0, Number(glasses)), Number(target_liters || 3.0), today]
    );

    saveDb();
    res.json({ success: true, glasses, date: today });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/view-all-users (Admin Dashboard)
app.get("/api/view-all-users", async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const query = `
      SELECT u.id, u.name, u.age, u.weight, u.goal, u.intensity, u.schedule, u.created_at, u.updated_at,
             p.original_plan, p.updated_plan, p.nutrition_tip, p.meal_plan, p.current_version,
             (SELECT COUNT(*) FROM workout_completions c WHERE c.user_id = u.id) as completion_count,
             (SELECT COUNT(*) FROM plan_versions v WHERE v.user_id = u.id) as version_count
      FROM users u
      LEFT JOIN workout_plans p ON u.id = p.user_id
      ORDER BY u.updated_at DESC
    `;

    const result = db.exec(query);
    if (!result[0]) {
      return res.json({ users: [] });
    }

    const users = result[0].values.map((row) => {
      let parsedMeal = null;
      try {
        if (row[12]) parsedMeal = JSON.parse(row[12] as string);
      } catch (e) {}

      return {
        id: row[0],
        name: row[1],
        age: row[2],
        weight: row[3],
        goal: row[4],
        intensity: row[5],
        schedule: row[6],
        createdAt: row[7],
        updatedAt: row[8],
        original_plan: row[9] || "N/A",
        updated_plan: row[10] || "Not updated",
        nutrition_tip: row[11] || "N/A",
        meal_plan: parsedMeal,
        current_version: row[13] || "v1.0",
        completions_count: row[14] || 0,
        versions_count: row[15] || 1,
      };
    });

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Database info & stats
app.get("/api/db-stats", async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const userCount = (db.exec("SELECT COUNT(*) FROM users")[0]?.values[0]?.[0] as number) || 0;
    const planCount = (db.exec("SELECT COUNT(*) FROM workout_plans")[0]?.values[0]?.[0] as number) || 0;
    const versionCount = (db.exec("SELECT COUNT(*) FROM plan_versions")[0]?.values[0]?.[0] as number) || 0;
    const completionCount = (db.exec("SELECT COUNT(*) FROM workout_completions")[0]?.values[0]?.[0] as number) || 0;

    let fileSize = 0;
    const dbPath = path.join(process.cwd(), "fitbuddy.db");
    if (fs.existsSync(dbPath)) {
      fileSize = fs.statSync(dbPath).size;
    }

    res.json({
      engine: "SQLite 3 (via sql.js WebAssembly)",
      dbFile: "fitbuddy.db",
      fileSizeBytes: fileSize,
      tables: {
        users: userCount,
        workout_plans: planCount,
        plan_versions: versionCount,
        workout_completions: completionCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Activity 2.2 Endpoints for API compatibility
app.post("/api/generate-workout/gemini", async (req: Request, res: Response) => {
  try {
    const { goal, intensity } = req.body;
    const plan = await generate_workout_gemini({ goal, intensity });
    res.json({ model: "gemini-3.8-flash", workout_plan: plan });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/nutrition-tip", async (req: Request, res: Response) => {
  try {
    const goal = (req.query.goal as string) || "general fitness";
    const tip = await generate_nutrition_tip_with_flash(goal);
    res.json({ goal, nutrition_tip: tip });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/generate-plan", async (req: Request, res: Response) => {
  try {
    const { user_id, username, age, weight, goal, intensity } = req.body;
    const db = await getDb();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO users (id, name, age, weight, goal, intensity, schedule, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 7, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, age = excluded.age, weight = excluded.weight,
         goal = excluded.goal, intensity = excluded.intensity, updated_at = excluded.updated_at`,
      [Number(user_id), username, Number(age), Number(weight), goal, intensity, now, now]
    );

    const plan = await generate_workout_gemini({ goal, intensity });
    const tip = await generate_nutrition_tip_with_flash(goal);

    db.run(
      `INSERT INTO workout_plans (user_id, original_plan, nutrition_tip, current_version, created_at, updated_at)
       VALUES (?, ?, ?, 'v1.0', ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         original_plan = excluded.original_plan, nutrition_tip = excluded.nutrition_tip, updated_at = excluded.updated_at`,
      [Number(user_id), plan, tip, now, now]
    );

    saveDb();
    res.json({ message: "Plan saved in SQLite!", workout_plan: plan, nutrition_tip: tip });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/users/:user_id", async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.user_id);
    const db = await getDb();
    db.run(`DELETE FROM users WHERE id = ${userId}`);
    db.run(`DELETE FROM workout_plans WHERE user_id = ${userId}`);
    db.run(`DELETE FROM plan_versions WHERE user_id = ${userId}`);
    db.run(`DELETE FROM workout_completions WHERE user_id = ${userId}`);
    saveDb();
    res.json({ success: true, message: `User ${userId} deleted from SQLite.` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/reset-data", async (_req: Request, res: Response) => {
  try {
    const dbPath = path.join(process.cwd(), "fitbuddy.db");
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    await getDb(); // Recreates and seeds
    res.json({ success: true, message: "SQLite database re-seeded successfully." });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Vite or Static Serving
async function startServer() {
  await getDb(); // Ensure SQLite DB initialized

  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FitBuddy SQLite Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
