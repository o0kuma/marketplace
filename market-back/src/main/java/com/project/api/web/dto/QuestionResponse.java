package com.project.api.web.dto;

import com.project.api.domain.Question;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponse {

    private Long id;
    private Long productId;
    private String productName;
    private Long authorId;
    private String authorName;
    private String content;
    private LocalDateTime createdAt;
    private String sellerAnswer;
    private LocalDateTime answeredAt;

    public static QuestionResponse from(Question q) {
        return QuestionResponse.builder()
                .id(q.getId())
                .productId(q.getProduct().getId())
                .productName(q.getProduct().getName())
                .authorId(q.getAuthor().getId())
                .authorName(q.getAuthor().getName())
                .content(q.getContent())
                .createdAt(q.getCreatedAt())
                .sellerAnswer(q.getSellerAnswer())
                .answeredAt(q.getAnsweredAt())
                .build();
    }
}
