package com.project.api.web.dto;

import com.project.api.domain.Notice;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoticeListItemResponse {

    private Long id;
    private String title;
    private boolean pinned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NoticeListItemResponse from(Notice n) {
        return NoticeListItemResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .pinned(n.isPinned())
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }
}
