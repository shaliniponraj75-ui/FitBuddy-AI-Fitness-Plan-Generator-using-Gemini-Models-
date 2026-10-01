export interface UserProfile {
  id: number;
  name: string;
  age: number;
  weight: number;
  goal: string;
  intensity: "Low" | "Medium" | "High";
  schedule?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MealRecommendation {
  meal: string;
  items: string;
}

export interface MealPlanData {
  calories: string;
  macros: {
    protein: string;
    carbs: string;
    fats: string;
  };
  hydrationTarget: string;
  hydrationAdvice?: string;
  recoveryGuidance?: string;
  meals: MealRecommendation[];
}

export interface PlanVersionItem {
  id: number;
  version_label: string;
  plan_text: string;
  nutrition_tip: string;
  feedback: string;
  created_at: string;
}

export interface PlanData {
  userId: number;
  originalPlan: string;
  updatedPlan: string | null;
  nutritionTip: string;
  mealPlan?: MealPlanData | null;
  currentVersion?: string;
  history?: Array<{ feedback: string; plan: string; timestamp: string }>;
}

export interface UserSummaryItem {
  id: number;
  name: string;
  age: number;
  weight: number;
  goal: string;
  intensity: "Low" | "Medium" | "High";
  schedule: number;
  original_plan: string;
  updated_plan: string;
  nutrition_tip: string;
  meal_plan: MealPlanData | null;
  current_version: string;
  completions_count: number;
  versions_count: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTimerState {
  mode: "rest" | "interval" | "stopwatch";
  isRunning: boolean;
  timeLeft: number;
  totalDuration: number;
  currentRound?: number;
  totalRounds?: number;
  isWorkInterval?: boolean;
}
