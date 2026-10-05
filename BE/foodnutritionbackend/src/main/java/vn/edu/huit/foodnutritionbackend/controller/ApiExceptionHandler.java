package vn.edu.huit.foodnutritionbackend.controller;

import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.http.converter.HttpMessageNotReadableException;

@RestControllerAdvice
public class ApiExceptionHandler {
	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<?> status(ResponseStatusException e) {
		return ResponseEntity.status(e.getStatusCode())
				.body(Map.of("message", e.getReason() == null ? "Yêu cầu không hợp lệ" : e.getReason()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<?> validation(MethodArgumentNotValidException e) {
		return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu không hợp lệ", "errors", e.getBindingResult()
				.getFieldErrors().stream().map(x -> x.getField() + ": " + x.getDefaultMessage()).toList()));
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<?> conflict(DataIntegrityViolationException e) {
		return ResponseEntity.status(409).body(Map.of("message", "Dữ liệu trùng, không hợp lệ hoặc đang được sử dụng"));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<?> malformed(HttpMessageNotReadableException e) {
		return ResponseEntity.badRequest().body(Map.of("message", "JSON hoặc kiểu dữ liệu không hợp lệ"));
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<?> upload(MaxUploadSizeExceededException e) {
		return ResponseEntity.status(413).body(Map.of("message", "Ảnh quá lớn; tối đa 10 MB"));
	}
}
