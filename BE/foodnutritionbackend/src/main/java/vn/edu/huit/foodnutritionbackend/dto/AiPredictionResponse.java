package vn.edu.huit.foodnutritionbackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AiPredictionResponse(@JsonProperty("food_detected") Boolean foodDetected,
		@JsonProperty("bounding_box") BoundingBox boundingBox, List<Prediction> predictions) {
	public record BoundingBox(Integer x1, Integer y1, Integer x2, Integer y2) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Prediction(@JsonProperty("class") String label, Double confidence) {
	}
}
