package com.project.api.web.dto;

import com.project.api.domain.AdminActionLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminActionLogResponse {
    private Long id;
    private Long adminId;
    private String actionType;
    private String targetType;
    private Long targetId;
    private String reason;
    private String details;
    private LocalDateTime createdAt;

    public static AdminActionLogResponse from(AdminActionLog log) {
        return AdminActionLogResponse.builder()
                .id(log.getId())
                .adminId(log.getAdminId())
                .actionType(log.getActionType())
                .targetType(log.getTargetType())
                .targetId(log.getTargetId())
                .reason(log.getReason())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
