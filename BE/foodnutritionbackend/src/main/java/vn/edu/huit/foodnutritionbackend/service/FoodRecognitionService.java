package vn.edu.huit.foodnutritionbackend.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.util.*;
import org.springframework.web.client.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import javax.imageio.ImageIO;
import java.io.*;
import java.util.*;
import vn.edu.huit.foodnutritionbackend.dto.AiPredictionResponse;
import vn.edu.huit.foodnutritionbackend.repository.FoodRepository;

@Service
@RequiredArgsConstructor
public class FoodRecognitionService {
	private static final Logger log = LoggerFactory.getLogger(FoodRecognitionService.class);
	// Dedicated Jackson 3 mapper for the AI wire format. Preserve @JsonProperty
	// mappings.
	// Initialized here to preserve the existing one-argument constructor and
	// service tests.
	private final JsonMapper aiJsonMapper = JsonMapper.builder().build();
	private final FoodRepository foods;
	@Value("${foodlens.ai-url}")
	private String aiUrl;

	public Map<String, Object> analyzeImageAndGetNutrition(MultipartFile file) {
		if (file.isEmpty() || file.getSize() > 10 * 1024 * 1024)
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh rỗng hoặc vượt 10 MB");
		try {
			byte[] bytes = file.getBytes();
			String format;
			try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
				var readers = ImageIO.getImageReaders(input);
				if (!readers.hasNext())
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ ảnh JPEG/PNG");
				var reader = readers.next();
				try {
					reader.setInput(input);
					format = reader.getFormatName().toLowerCase(Locale.ROOT);
					if (!Set.of("jpeg", "jpg", "png").contains(format))
						throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ ảnh JPEG/PNG");
					if ((long) reader.getWidth(0) * reader.getHeight(0) > 25_000_000)
						throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh tối đa 25 megapixel");
					reader.read(0); // Decode to reject corrupt image data after checking dimensions.
				} finally {
					reader.dispose();
				}
			}
			final String filename = format.equals("png") ? "upload.png" : "upload.jpg";
			var resource = new ByteArrayResource(bytes) {
				@Override
				public String getFilename() {
					return filename;
				}
			};
			MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
			body.add("file", resource);
			var headers = new HttpHeaders();
			headers.setContentType(MediaType.MULTIPART_FORM_DATA);
			var factory = new SimpleClientHttpRequestFactory();
			factory.setConnectTimeout(5000);
			factory.setReadTimeout(60000);
			var rest = new RestTemplate(factory);
			headers.setAccept(List.of(MediaType.APPLICATION_JSON));
			// Read the actual response body first; do not let a default JSON converter pick
			// the DTO mapping.
			var response = rest.postForEntity(aiUrl, new HttpEntity<>(body, headers), String.class);

			var rawJson = response.getBody();

			log.info("AI CALL url={} status={} location={} bodyLength={}", aiUrl, response.getStatusCode().value(),
					response.getHeaders().getLocation(), rawJson == null ? 0 : rawJson.length());

			return mapPrediction(parseAiResponse(rawJson));
		} catch (ResponseStatusException e) {
			throw e;
		} catch (ResourceAccessException e) {
			throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT, "AI chưa sẵn sàng hoặc xử lý quá lâu");
		} catch (RestClientException e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI trả dữ liệu không hợp lệ");
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không đọc được ảnh");
		}
	}

	public AiPredictionResponse parseAiResponse(String rawJson) {
		if (rawJson == null || rawJson.isBlank()) {
			log.warn("AI endpoint {} returned an empty response", aiUrl);
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI trả phản hồi rỗng");
		}
		try {
			var root = aiJsonMapper.readTree(rawJson);
			if (root == null || !root.isObject()) {
				log.warn("AI endpoint {} returned JSON that is not an object", aiUrl);
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI phải trả một JSON object");
			}
			var detected = root.get("food_detected");
			log.info("AI endpoint={} food_detected={} has_predictions={}", aiUrl, detected, root.has("predictions"));
			if (detected == null || !detected.isBoolean()) {
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
						"Phản hồi thực tế từ AI thiếu food_detected kiểu boolean; kiểm tra AI_URL và log backend");
			}
			var parsed = aiJsonMapper.readValue(rawJson, AiPredictionResponse.class);
			if (parsed == null || parsed.foodDetected() == null) {
				log.error("AI JSON contains food_detected but DTO mapping returned null");
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không ánh xạ được JSON AI sang DTO");
			}
			return parsed;
		} catch (JacksonException e) {
			log.warn("Unable to parse AI JSON from {}: {}", aiUrl, e.getClass().getSimpleName());
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI trả JSON không đúng cấu trúc dự kiến");
		}
	}

	public Map<String, Object> mapPrediction(AiPredictionResponse ai) {
		if (ai == null || ai.foodDetected() == null)
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI thiếu food_detected");
		Map<String, Object> out = new LinkedHashMap<>();
		out.put("food_detected", ai.foodDetected());
		out.put("bounding_box", ai.boundingBox());
		out.put("nutrition_info", null);
		if (!ai.foodDetected()) {
			out.put("predictions", List.of());
			out.put("message", "Không phát hiện món ăn");
			return out;
		}
		if (ai.predictions() == null || ai.predictions().isEmpty())
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI không có dự đoán");
		for (var p : ai.predictions())
			if (p == null || p.label() == null || p.label().isBlank() || p.confidence() == null
					|| !Double.isFinite(p.confidence()) || p.confidence() < 0 || p.confidence() > 100)
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Dự đoán AI không hợp lệ");
		var sorted = ai.predictions().stream()
				.sorted(Comparator.comparingDouble(AiPredictionResponse.Prediction::confidence).reversed()).toList();
		var best = sorted.get(0);
		out.put("ai_prediction", best.label());
		out.put("confidence", best.confidence() / 100.0);
		out.put("predictions",
				sorted.stream().map(p -> Map.of("label", p.label(), "confidence", p.confidence() / 100.0)).toList());
		var matched = foods.findByAiLabel(best.label());
		if (matched.size() == 1)
			out.put("nutrition_info", matched.get(0));
		else if (matched.isEmpty())
			out.put("message", "Chưa có dinh dưỡng cho nhãn này. Hãy chọn món thủ công.");
		else {
			out.put("candidates", matched);
			out.put("message", "Có nhiều món cho nhãn này. Hãy xác nhận món.");
		}
		return out;
	}
}
