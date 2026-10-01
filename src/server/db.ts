import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "fitbuddy.db");

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn("Could not read existing fitbuddy.db, creating fresh:", err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Initialize SQLite schemas matching FitBuddy models
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      weight REAL NOT NULL,
      goal TEXT NOT NULL,
      intensity TEXT NOT NULL,
      schedule INTEGER DEFAULT 7,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      original_plan TEXT NOT NULL,
      updated_plan TEXT,
      nutrition_tip TEXT,
      meal_plan TEXT,
      current_version TEXT DEFAULT 'v1.0',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plan_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      version_label TEXT NOT NULL,
      plan_text TEXT NOT NULL,
      nutrition_tip TEXT,
      meal_plan TEXT,
      feedback TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workout_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      day_number INTEGER NOT NULL,
      exercise_id TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      UNIQUE(user_id, day_number, exercise_id)
    );

    CREATE TABLE IF NOT EXISTS hydration_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      glasses_drank INTEGER DEFAULT 0,
      target_liters REAL NOT NULL,
      log_date TEXT NOT NULL,
      UNIQUE(user_id, log_date)
    );
  `);

  // Seed default data if empty
  const countRes = dbInstance.exec("SELECT COUNT(*) AS cnt FROM users");
  const count = countRes[0]?.values[0]?.[0] as number;
  if (!count || count === 0) {
    seedDatabase(dbInstance);
  }

  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error("Failed to save fitbuddy.db to disk:", err);
  }
}

function seedDatabase(db: Database) {
  const now = new Date().toISOString();
  const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString();
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

  // User 10: John Doe
  db.run(
    `INSERT INTO users (id, name, age, weight, goal, intensity, schedule, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [10, "John Doe", 28, 76.5, "Lose belly fat and gain muscles", "Medium", 7, twoDaysAgo, now]
  );

  const plan10Original = `Day 1: Upper Body Strength & Core
Warm-up: 5 mins jumping jacks and arm circles.
Main Workout:
- Dumbbell Bench Press: 3 sets x 10 reps (Rest: 60s)
- Bent-over Rows: 3 sets x 12 reps (Rest: 60s)
- Push-ups: 3 sets to failure (Rest: 45s)
- Dumbbell Bicep Curls: 3 sets x 12 reps (Rest: 45s)
Cooldown: 5 mins light jogging and shoulder stretch.

Day 2: Core & HIIT Cardio
Warm-up: 5 mins high knees and torso twists.
Main Workout:
- Mountain Climbers: 4 sets x 30 secs (Rest: 30s)
- Bicycle Crunches: 4 sets x 20 reps (Rest: 30s)
- Plank: 3 sets x 45 secs (Rest: 45s)
- Jump Rope: 4 sets x 1 min (Rest: 45s)
Cooldown: 5 mins cobra stretch and deep breathing.

Day 3: Lower Body Hypertrophy
Warm-up: 5 mins bodyweight squats and hip openers.
Main Workout:
- Goblet Squats: 4 sets x 12 reps (Rest: 75s)
- Romanian Deadlifts: 3 sets x 10 reps (Rest: 75s)
- Walking Lunges: 3 sets x 12 reps per leg (Rest: 60s)
- Standing Calf Raises: 4 sets x 15 reps (Rest: 45s)
Cooldown: 5 mins quad and hamstring static stretches.

Day 4: Active Recovery & Mobility
Warm-up: 5 mins brisk walking.
Main Workout: Full body foam rolling and mobility drills (30 mins).
Cooldown: 10 mins relaxation breathing.

Day 5: Full Body Metabolic Conditioning
Warm-up: 5 mins dynamic stretch sequence.
Main Workout:
- Kettlebell Swings: 4 sets x 15 reps (Rest: 60s)
- Burpees: 3 sets x 10 reps (Rest: 60s)
- Dumbbell Thrusters: 3 sets x 12 reps (Rest: 60s)
- Hanging Knee Raises: 3 sets x 12 reps (Rest: 45s)
Cooldown: 5 mins child's pose and calf stretch.

Day 6: Core Endurance & Steady Cardio
Warm-up: 5 mins brisk treadmill walk.
Main Workout: 30 mins moderate intensity steady-state jog + core circuits (Rest: 45s).
Cooldown: 5 mins full body spinal stretch.

Day 7: Rest & Regeneration
Warm-up: None required.
Main Workout: 20 min leisurely walk in nature.
Cooldown: 10 min gentle stretching.`;

  const plan10Updated = `Day 1: Upper Body Strength & Core Yoga
Warm-up: 5 mins jumping jacks and arm circles.
Main Workout:
- Dumbbell Bench Press: 3 sets x 10 reps (Rest: 60s)
- Bent-over Rows: 3 sets x 12 reps (Rest: 60s)
- Push-ups: 3 sets to failure (Rest: 45s)
- Dumbbell Bicep Curls: 3 sets x 12 reps (Rest: 45s)
Cooldown: 15 mins core-focused vinyasa yoga flow and shoulder openers. (Updated per feedback)

Day 2: Core & HIIT Cardio
Warm-up: 5 mins high knees and torso twists.
Main Workout:
- Mountain Climbers: 4 sets x 30 secs (Rest: 30s)
- Bicycle Crunches: 4 sets x 20 reps (Rest: 30s)
- Plank: 3 sets x 45 secs (Rest: 45s)
- Jump Rope: 4 sets x 1 min (Rest: 45s)
Cooldown: 15 mins restorative yoga and calming breathwork. (Updated per feedback)

Day 3: Lower Body Hypertrophy
Warm-up: 5 mins bodyweight squats and hip openers.
Main Workout:
- Goblet Squats: 4 sets x 12 reps (Rest: 75s)
- Romanian Deadlifts: 3 sets x 10 reps (Rest: 75s)
- Walking Lunges: 3 sets x 12 reps per leg (Rest: 60s)
- Standing Calf Raises: 4 sets x 15 reps (Rest: 45s)
Cooldown: 15 mins hip-opening yoga (pigeon pose, butterfly). (Updated per feedback)

Day 4: Active Recovery & Gentle Yoga
Warm-up: 5 mins gentle breathing.
Main Workout: 35 mins full body gentle Hatha yoga for muscle recovery.
Cooldown: Savasana relaxation.

Day 5: Full Body Metabolic Conditioning
Warm-up: 5 mins dynamic flow.
Main Workout:
- Kettlebell Swings: 4 sets x 15 reps (Rest: 60s)
- Burpees: 3 sets x 10 reps (Rest: 60s)
- Dumbbell Thrusters: 3 sets x 12 reps (Rest: 60s)
- Hanging Knee Raises: 3 sets x 12 reps (Rest: 45s)
Cooldown: 15 mins calming yoga stretches.

Day 6: Core Endurance & Steady Cardio
Warm-up: 5 mins brisk treadmill walk.
Main Workout: 25 mins steady cardio + core circuit (Rest: 45s).
Cooldown: 15 mins yoga sun salutations and gentle spinal twists.

Day 7: Rest & Meditation
Warm-up: None.
Main Workout: 20 min leisurely walk + 15 min guided restorative yoga.
Cooldown: Full body progressive relaxation.`;

  const mealPlan10 = JSON.stringify({
    calories: "2,250 kcal",
    macros: {
      protein: "165g (30%)",
      carbs: "220g (40%)",
      fats: "75g (30%)",
    },
    hydrationTarget: "3.2 Liters",
    meals: [
      { meal: "Breakfast", items: "3 Scrambled Eggs with spinach, 2 slices whole grain toast, 1/2 avocado" },
      { meal: "Morning Snack", items: "Greek yogurt (200g) with blueberries and a drizzle of honey" },
      { meal: "Lunch", items: "Grilled chicken breast (180g), quinoa (1 cup), steamed broccoli and olive oil" },
      { meal: "Pre-Workout", items: "1 banana with 1 tbsp almond butter, green tea" },
      { meal: "Post-Workout", items: "Whey protein shake (30g protein) with 300ml almond milk" },
      { meal: "Dinner", items: "Baked salmon (200g), sweet potato mash, asparagus spears" },
    ],
  });

  const tip10 =
    "Prioritize 25-30g of high-quality protein within 45 minutes post-workout to support muscle protein synthesis, and maintain hydration with at least 3 liters of water daily.";

  db.run(
    `INSERT INTO workout_plans (user_id, original_plan, updated_plan, nutrition_tip, meal_plan, current_version, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [10, plan10Original, plan10Updated, tip10, mealPlan10, "v1.1", twoDaysAgo, now]
  );

  // Versions for User 10
  db.run(
    `INSERT INTO plan_versions (user_id, version_label, plan_text, nutrition_tip, meal_plan, feedback, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [10, "v1.0", plan10Original, tip10, mealPlan10, "Initial Gemini Generation", twoDaysAgo]
  );

  db.run(
    `INSERT INTO plan_versions (user_id, version_label, plan_text, nutrition_tip, meal_plan, feedback, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [10, "v1.1", plan10Updated, tip10, mealPlan10, "Add 15 minutes of yoga into the daily cooldown", now]
  );

  // Completions for User 10 (Day 1 completed)
  db.run(
    `INSERT OR IGNORE INTO workout_completions (user_id, day_number, exercise_id, completed_at)
     VALUES (10, 1, 'ex-1', ?), (10, 1, 'ex-2', ?), (10, 1, 'ex-3', ?), (10, 2, 'ex-1', ?)`,
    [twoDaysAgo, twoDaysAgo, twoDaysAgo, oneDayAgo]
  );

  // Hydration for User 10
  const todayStr = new Date().toISOString().split("T")[0];
  db.run(
    `INSERT OR IGNORE INTO hydration_logs (user_id, glasses_drank, target_liters, log_date)
     VALUES (10, 7, 3.2, ?)`,
    [todayStr]
  );

  // User 101: Sarah Connor
  db.run(
    `INSERT INTO users (id, name, age, weight, goal, intensity, schedule, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [101, "Sarah Connor", 34, 62.0, "Weight loss & flexibility", "High", 7, oneDayAgo, oneDayAgo]
  );

  const plan101Original = `Day 1: High Intensity Interval Training (HIIT)
Warm-up: 5 mins light jog and dynamic arm swings.
Main Workout:
- Sprint intervals: 30s sprint / 30s walk (10 rounds) (Rest: 30s)
- Jump Squats: 3 sets x 15 reps (Rest: 45s)
- Mountain Climbers: 3 sets x 40 reps (Rest: 45s)
Cooldown: 8 mins hamstring and calf stretch.

Day 2: Total Body Dynamic Mobility & Core
Warm-up: 5 mins cat-cow and bird-dog.
Main Workout:
- Kettlebell Goblet Squats: 3 sets x 12 reps (Rest: 60s)
- Push-up to Downward Dog: 3 sets x 10 reps (Rest: 45s)
- Side Planks: 3 sets x 30s each side (Rest: 30s)
Cooldown: 10 mins deep hip flexor stretches.

Day 3: Cardio Blast & Calorie Burn
Warm-up: 5 mins jump rope.
Main Workout:
- Rowing machine: 20 mins intervals (1 min fast / 1 min easy) (Rest: 60s)
- Burpees: 3 sets x 12 reps (Rest: 45s)
- Kettlebell Swings: 3 sets x 20 reps (Rest: 45s)
Cooldown: 7 mins torso and quad static stretching.

Day 4: Active Recovery & Deep Stretch
Warm-up: 5 mins brisk walk.
Main Workout: 40 mins dynamic flow and deep stretching routine.
Cooldown: 5 mins mindful breathing.

Day 5: Tabata Full Body Conditioning
Warm-up: 5 mins jumping jacks.
Main Workout:
- High Knees & Squat Jumps (4 mins Tabata 20s/10s) (Rest: 60s)
- Push-ups & Russian Twists (4 mins Tabata 20s/10s) (Rest: 60s)
Cooldown: 8 mins cobra pose and child's pose.

Day 6: Speed Intervals & Core
Warm-up: 5 mins dynamic leg swings.
Main Workout: 25 mins tempo run + 10 mins continuous core circuit (Rest: 45s).
Cooldown: 8 mins full body stretch.

Day 7: Rest & Self-Care
Warm-up: None.
Main Workout: 30 min recovery walk in nature.
Cooldown: 10 min gentle breathing.`;

  const tip101 =
    "Electrolyte balance is crucial for high-intensity training. Add a pinch of sea salt and lemon to your water, and focus on antioxidant-rich berries to reduce oxidative stress.";

  const mealPlan101 = JSON.stringify({
    calories: "1,750 kcal",
    macros: {
      protein: "130g (30%)",
      carbs: "175g (40%)",
      fats: "58g (30%)",
    },
    hydrationTarget: "2.8 Liters",
    meals: [
      { meal: "Breakfast", items: "Oatmeal with chia seeds, scoop of plant protein, fresh berries" },
      { meal: "Morning Snack", items: "Handful of raw almonds (25g) and 1 green apple" },
      { meal: "Lunch", items: "Mediterranean Tuna Salad with mixed greens, chickpeas, cucumber, lemon tahini" },
      { meal: "Pre-Workout", items: "2 Rice cakes with peanut butter" },
      { meal: "Dinner", items: "Grilled turkey breast, roasted zucchini, bell peppers, wild rice" },
    ],
  });

  db.run(
    `INSERT INTO workout_plans (user_id, original_plan, updated_plan, nutrition_tip, meal_plan, current_version, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [101, plan101Original, null, tip101, mealPlan101, "v1.0", oneDayAgo, oneDayAgo]
  );

  db.run(
    `INSERT INTO plan_versions (user_id, version_label, plan_text, nutrition_tip, meal_plan, feedback, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [101, "v1.0", plan101Original, tip101, mealPlan101, "Initial Gemini Generation", oneDayAgo]
  );
}
