package com.project.api.web;

import com.project.api.service.ReviewService;
import com.project.api.web.dto.PageResponse;
import com.project.api.web.dto.ReplyRequest;
import com.project.api.web.dto.ReviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/reviews")
@RequiredArgsConstructor
public class SellerReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public PageResponse<ReviewResponse> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long sellerId = Long.parseLong(user.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        return reviewService.getBySellerProduct(sellerId, pageable);
    }

    @PatchMapping("/{id}/reply")
    public ReviewResponse reply(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody ReplyRequest request) {
        Long sellerId = Long.parseLong(user.getUsername());
        String reply = request != null ? request.getReply() : null;
        return reviewService.setSellerReply(id, sellerId, reply);
    }
}
