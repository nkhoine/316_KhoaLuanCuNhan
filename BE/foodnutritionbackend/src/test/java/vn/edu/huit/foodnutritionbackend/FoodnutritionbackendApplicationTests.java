package vn.edu.huit.foodnutritionbackend;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.*;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.huit.foodnutritionbackend.service.*;
import vn.edu.huit.foodnutritionbackend.repository.*;
import vn.edu.huit.foodnutritionbackend.entity.*;
import vn.edu.huit.foodnutritionbackend.dto.*;

class FoodnutritionbackendApplicationTests {
	@Test
	void aiConvertsPercentToFractionAndMapsFood() {
		var foods = mock(FoodRepository.class);
		var f = new Food();
		f.setId(4L);
		when(foods.findByAiLabel("pho")).thenReturn(List.of(f));
		var ai = new AiPredictionResponse(true, null, List.of(new AiPredictionResponse.Prediction("pho", 58.46)));
		var result = new FoodRecognitionService(foods).mapPrediction(ai);
		assertEquals(0.5846, (Double) result.get("confidence"), 0.000001);
		assertSame(f, result.get("nutrition_info"));
	}

	@Test
	void noDetectionDoesNotQueryNutrition() {
		var foods = mock(FoodRepository.class);
		var result = new FoodRecognitionService(foods).mapPrediction(new AiPredictionResponse(false, null, null));
		assertEquals(false, result.get("food_detected"));
		verifyNoInteractions(foods);
	}

	@Test
	void invalidAiConfidenceRejected() {
		var service = new FoodRecognitionService(mock(FoodRepository.class));
		assertThrows(ResponseStatusException.class, () -> service.mapPrediction(
				new AiPredictionResponse(true, null, List.of(new AiPredictionResponse.Prediction("pho", 101.0)))));
	}

	@Test
	void userCannotUpdateOrDeleteOthersMeal() {
		var logs = mock(MealLogRepository.class);
		var details = mock(MealLogDetailRepository.class);
		var users = mock(UserRepository.class);
		var foods = mock(FoodRepository.class);
		var a = new User();
		a.setId(1L);
		var b = new User();
		b.setId(2L);
		var meal = new MealLog();
		meal.setUser(b);
		var detail = new MealLogDetail();
		detail.setMealLog(meal);
		when(users.lockById(1L)).thenReturn(Optional.of(a));
		when(details.findById(7L)).thenReturn(Optional.of(detail));
		var service = new MealLogService(logs, details, foods, users);
		assertEquals(404, assertThrows(ResponseStatusException.class, () -> service.updateWeight(1L, 7L, 100))
				.getStatusCode().value());
		assertEquals(404, assertThrows(ResponseStatusException.class, () -> service.deleteDetail(1L, 7L))
				.getStatusCode().value());
		verify(details, never()).saveAndFlush(any());
		verify(details, never()).delete(any());
	}
}
