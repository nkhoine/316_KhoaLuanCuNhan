package vn.edu.huit.foodnutritionbackend.service;

import java.time.OffsetDateTime;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Service
public class AiLabelService {
	private final JdbcTemplate jdbc;
	private final TransactionTemplate tx;
	private final JsonMapper mapper = JsonMapper.builder().build();
	private final RestTemplate rest;
	private final String labelsUrl;

	public AiLabelService(JdbcTemplate jdbc, PlatformTransactionManager manager,
			@Value("${foodlens.ai-labels-url:http://localhost:8000/labels}") String labelsUrl) {
		this.jdbc = jdbc;
		this.tx = new TransactionTemplate(manager);
		this.labelsUrl = labelsUrl;
		var factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(5000);
		factory.setReadTimeout(15000);
		this.rest = new RestTemplate(factory);
	}

	public record RawLabel(Integer index, String label) {
	}

	public record RawLabels(Integer total, List<RawLabel> labels) {
	}

	public record FoodRef(long id, String name) {
	}

	public record LabelView(String label, int index, boolean active, OffsetDateTime syncedAt, List<FoodRef> foods) {
	}

	public record SyncResult(int total, int added, int existing, int inactive) {
	}

	// Public pure validator so the AI contract can be unit-tested without a DB.
	public static void validate(RawLabels data) {
		if (data == null || data.total() == null || data.labels() == null || data.total() < 1 || data.total() > 10000
				|| data.total() != data.labels().size()) {
			throw badGateway("Danh sách nhãn AI rỗng hoặc total không khớp");
		}
		var labels = new HashSet<String>();
		var indexes = new HashSet<Integer>();
		for (var item : data.labels()) {
			if (item == null || item.index() == null || item.index() < 0 || item.index() >= data.total()
					|| item.label() == null || item.label().isBlank() || item.label().length() > 100
					|| !item.label().equals(item.label().strip()) || !labels.add(item.label())
					|| !indexes.add(item.index())) {
				throw badGateway("AI trả nhãn/index trùng hoặc không hợp lệ");
			}
		}
	}

	private static ResponseStatusException badGateway(String message) {
		return new ResponseStatusException(HttpStatus.BAD_GATEWAY, message);
	}

	public List<LabelView> list() {
		// One LEFT JOIN, including labels with no mapped food. No N+1 queries.
		return jdbc.query("""
				SELECT l.label, l.class_index, l.active, l.synced_at,
				       f.id AS food_id, f.name AS food_name
				FROM ai_labels l LEFT JOIN foods f ON f.ai_label = l.label
				ORDER BY l.active DESC, l.class_index, l.label, f.id
				""", rs -> {
			var result = new LinkedHashMap<String, LabelView>();
			while (rs.next()) {
				String label = rs.getString("label");
				var view = result.get(label);
				if (view == null) {
					view = new LabelView(label, rs.getInt("class_index"), rs.getBoolean("active"),
							rs.getObject("synced_at", OffsetDateTime.class), new ArrayList<>());
					result.put(label, view);
				}
				long id = rs.getLong("food_id");
				if (!rs.wasNull())
					view.foods().add(new FoodRef(id, rs.getString("food_name")));
			}
			return new ArrayList<>(result.values());
		});
	}

	public SyncResult sync() {
		final RawLabels data;
		try {
			var response = rest.getForEntity(labelsUrl, String.class);
			if (!response.getStatusCode().is2xxSuccessful()) {
				throw badGateway("AI /labels trả HTTP " + response.getStatusCode().value()
						+ "; kiểm tra URL, không dùng đường dẫn chuyển hướng");
			}
			String body = response.getBody();
			if (body == null || body.isBlank())
				throw badGateway("AI /labels trả phản hồi rỗng");
			data = mapper.readValue(body, RawLabels.class);
		} catch (ResourceAccessException e) {
			throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT, "Không kết nối được AI /labels");
		} catch (RestClientException | JacksonException e) {
			throw badGateway("Không đọc được danh sách nhãn AI; kiểm tra FastAPI /labels");
		}
		// Validate all labels BEFORE touching the database. Do not hold DB locks over
		// HTTP.
		validate(data);
		return tx.execute(status -> {
			// Serialize sync operations across backend instances; released on
			// commit/rollback.
			jdbc.execute("SELECT pg_advisory_xact_lock(1498000)");
			var old = new HashSet<>(jdbc.queryForList("SELECT label FROM ai_labels", String.class));
			int added = 0;
			jdbc.update("UPDATE ai_labels SET active = false");
			for (var item : data.labels()) {
				if (!old.contains(item.label()))
					added++;
				jdbc.update("""
						INSERT INTO ai_labels(label, class_index, active, synced_at)
						VALUES (?, ?, true, CURRENT_TIMESTAMP)
						ON CONFLICT (label) DO UPDATE SET
						    class_index = EXCLUDED.class_index, active = true,
						    synced_at = CURRENT_TIMESTAMP
						""", item.label(), item.index());
			}
			int inactive = Objects.requireNonNull(
					jdbc.queryForObject("SELECT count(*) FROM ai_labels WHERE active = false", Integer.class));
			return new SyncResult(data.total(), added, data.total() - added, inactive);
		});
	}

	public void map(String label, Long foodId) {
		if (foodId == null || foodId <= 0)
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID món không hợp lệ");
		tx.executeWithoutResult(status -> {
			var active = jdbc.queryForList("SELECT active FROM ai_labels WHERE label = ? FOR SHARE", Boolean.class,
					label);
			if (active.isEmpty())
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhãn");
			if (!active.get(0))
				throw new ResponseStatusException(HttpStatus.CONFLICT, "Nhãn không còn trong mô hình hiện tại");
			// Only update the mapping. Leave nutrition, category and image untouched.
			if (jdbc.update("UPDATE foods SET ai_label = ? WHERE id = ?", label, foodId) == 0)
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn");
		});
	}

	public void unmap(String label, Long foodId) {
		if (jdbc.update("UPDATE foods SET ai_label = NULL WHERE id = ? AND ai_label = ?", foodId, label) == 0)
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ánh xạ đã thay đổi; hãy tải lại danh sách");
	}
}
