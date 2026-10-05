package vn.edu.huit.foodnutritionbackend.service;

public final class NutritionMath {
	private NutritionMath() {
	}

	public static float scale(float nutrient, double consumed, double base) {
		if (!Float.isFinite(nutrient) || nutrient < 0 || !Double.isFinite(consumed) || consumed <= 0
				|| !Double.isFinite(base) || base <= 0)
			throw new IllegalArgumentException("Invalid nutrition or weight");
		double result = nutrient * consumed / base;
		if (!Double.isFinite(result) || result > Float.MAX_VALUE)
			throw new IllegalArgumentException("Nutrition overflow");
		return (float) result;
	}
}
