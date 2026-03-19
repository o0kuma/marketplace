package com.project.api.web.dto;

import com.project.api.domain.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private Long id;
    private Long productId;
    private String productName;
    private Long authorId;
    private String authorName;
    private Integer rating;
    private String content;
    private LocalDateTime createdAt;
    private String sellerReply;
    private LocalDateTime repliedAt;

    public static ReviewResponse from(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .productName(review.getProduct().getName())
                .authorId(review.getAuthor().getId())
                .authorName(review.getAuthor().getName())
                .rating(review.getRating())
                .content(review.getContent())
                .createdAt(review.getCreatedAt())
                .sellerReply(review.getSellerReply())
                .repliedAt(review.getRepliedAt())
                .build();
    }
}
