package com.project.api.service;

import com.project.api.domain.AdminActionLog;
import com.project.api.repository.AdminActionLogRepository;
import com.project.api.web.dto.AdminActionLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminActionLogService {

    private final AdminActionLogRepository adminActionLogRepository;

    @Transactional
    public void log(Long adminId, String actionType, String targetType, Long targetId, String reason, String details) {
        AdminActionLog row = AdminActionLog.builder()
                .adminId(adminId)
                .actionType(actionType)
                .targetType(targetType)
                .targetId(targetId)
                .reason(reason)
                .details(details)
                .build();
        adminActionLogRepository.save(row);
    }

    public Page<AdminActionLogResponse> listByTarget(String targetType, Long targetId, Pageable pageable) {
        return adminActionLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId, pageable)
                .map(AdminActionLogResponse::from);
    }
}
