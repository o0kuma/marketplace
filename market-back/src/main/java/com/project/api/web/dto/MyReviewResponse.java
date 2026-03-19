package com.project.api.web.dto;

import com.project.api.domain.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Review list item for "my reviews" with product name for display. */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyReviewResponse {

    private Long id;
    private Long productId;
    private String productName;
    private Integer rating;
    private String content;
    private LocalDateTime createdAt;

    public static MyReviewResponse from(Review review) {
        return MyReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .productName(review.getProduct().getName())
                .rating(review.getRating())
                .content(review.getContent())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
