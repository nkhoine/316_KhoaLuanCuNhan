export type AuthUser = { id: number; email: string; fullName: string; role: string };
export type AdminUser = AuthUser & { status: string };
export type Category = { id: number; name: string; description: string | null };
export type Food = { id: number; name: string; category: Category; baseServingG: number; calories: number; protein: number; carbs: number; fat: number; fiber: number | null; aiLabel: string | null; imageUrl: string | null };
export type DailySummary = {
 logDate: string; totalDailyCalories: number; totalDailyProtein: number; totalDailyCarbs: number; totalDailyFat: number; totalDailyFiber: number | null; fiberComplete: boolean;
 meals: { mealLogId: number; mealType: string; mealCalories: number; items: { id: number; foodId: number; foodName: string; consumedWeightG: number; actualCalories: number; actualProtein: number; actualCarbs: number; actualFat: number; actualFiber: number | null }[] }[];
};
export type Recognition = { food_detected: boolean; ai_prediction?: string; confidence?: number; predictions: {label: string; confidence: number}[]; nutrition_info: Food | null; candidates?: Food[]; message?: string };
