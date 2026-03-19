package com.project.api.web;

import com.project.api.domain.Notification;
import com.project.api.repository.NotificationRepository;
import com.project.api.web.dto.NotificationResponse;
import com.project.api.web.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Notification skeleton: list and mark as read.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public PageResponse<NotificationResponse> list(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long memberId = Long.parseLong(user.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        return PageResponse.of(notificationRepository.findByMemberIdOrderByCreatedAtDesc(memberId, pageable)
                .map(NotificationResponse::from));
    }

    @GetMapping("/unread-count")
    public long unreadCount(@AuthenticationPrincipal UserDetails user) {
        Long memberId = Long.parseLong(user.getUsername());
        return notificationRepository.countByMemberIdAndReadAtIsNull(memberId);
    }

    @PatchMapping("/{id}/read")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void markRead(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id) {
        Long memberId = Long.parseLong(user.getUsername());
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notification not found: " + id));
        if (!notification.getMember().getId().equals(memberId)) {
            throw new ForbiddenException("Not your notification");
        }
        notification.markRead();
    }
}
