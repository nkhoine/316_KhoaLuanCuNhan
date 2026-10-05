package vn.edu.huit.foodnutritionbackend.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import vn.edu.huit.foodnutritionbackend.service.AiLabelService;

@RestController
@RequestMapping("/api/admin/ai-labels")
public class AiLabelController {
	private final AiLabelService service;

	public AiLabelController(AiLabelService service) {
		this.service = service;
	}

	@GetMapping
	public List<AiLabelService.LabelView> list() {
		return service.list();
	}

	@PostMapping("/sync")
	public AiLabelService.SyncResult sync() {
		return service.sync();
	}

	@PutMapping("/{label}/foods/{foodId}")
	public void map(@PathVariable String label, @PathVariable Long foodId) {
		service.map(label, foodId);
	}

	@DeleteMapping("/{label}/foods/{foodId}")
	public void unmap(@PathVariable String label, @PathVariable Long foodId) {
		service.unmap(label, foodId);
	}
}
