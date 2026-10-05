package vn.edu.huit.foodnutritionbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import vn.edu.huit.foodnutritionbackend.service.FoodRecognitionService;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class FoodRecognitionController {
	private final FoodRecognitionService service;

	@PostMapping("/recognize")
	public Map<String, Object> recognize(@RequestParam("file") MultipartFile file) {
		return service.analyzeImageAndGetNutrition(file);
	}
}
