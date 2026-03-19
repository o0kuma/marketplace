package com.project.api.web.dto;

import com.project.api.domain.Question;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Question list item for "my questions" with product name for display. */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyQuestionResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String content;
    private LocalDateTime createdAt;

    public static MyQuestionResponse from(Question q) {
        return MyQuestionResponse.builder()
                .id(q.getId())
                .productId(q.getProduct().getId())
                .productName(q.getProduct().getName())
                .content(q.getContent())
                .createdAt(q.getCreatedAt())
                .build();
    }
}
