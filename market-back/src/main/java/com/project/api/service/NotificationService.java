package com.project.api.service;

import com.project.api.domain.Notification;
import com.project.api.domain.Order;
import com.project.api.domain.OrderStatus;
import com.project.api.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void notifyOrderStatusChange(Order order, OrderStatus newStatus) {
        String message = switch (newStatus) {
            case PAYMENT_COMPLETE -> "주문 #" + order.getId() + "이(가) 결제완료되었습니다.";
            case SHIPPING -> "주문 #" + order.getId() + "이(가) 배송중입니다.";
            case COMPLETE -> "주문 #" + order.getId() + "이(가) 배송 완료되었습니다.";
            case CANCELLED -> "주문 #" + order.getId() + "이(가) 취소되었습니다.";
            default -> null;
        };
        if (message != null) {
            Notification notification = Notification.builder()
                    .member(order.getBuyer())
                    .message(message)
                    .build();
            notificationRepository.save(notification);
        }
    }
}
