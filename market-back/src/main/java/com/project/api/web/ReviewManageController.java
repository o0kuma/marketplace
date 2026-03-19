package com.project.api.web;

import com.project.api.service.ReviewService;
import com.project.api.web.dto.ReviewResponse;
import com.project.api.web.dto.ReviewUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewManageController {

    private final ReviewService reviewService;

    @PatchMapping("/{id}")
    public ReviewResponse update(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ReviewUpdateRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        return reviewService.update(id, memberId, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        Long memberId = Long.parseLong(user.getUsername());
        reviewService.delete(id, memberId);
    }
}
