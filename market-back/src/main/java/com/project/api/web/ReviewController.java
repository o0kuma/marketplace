package com.project.api.web;

import com.project.api.service.ReviewService;
import com.project.api.web.dto.ReviewCreateRequest;
import com.project.api.web.dto.ReviewResponse;
import com.project.api.web.dto.ReviewableOrderItemResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public List<ReviewResponse> list(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reviewService.list(productId, pageable);
    }

    @GetMapping("/reviewable-order-items")
    public List<ReviewableOrderItemResponse> getReviewableOrderItems(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetails user) {
        Long memberId = Long.parseLong(user.getUsername());
        return reviewService.getReviewableOrderItems(memberId, productId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse create(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ReviewCreateRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        return reviewService.create(productId, memberId, request);
    }
}
