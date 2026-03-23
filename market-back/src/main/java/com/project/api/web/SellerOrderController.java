package com.project.api.web;

import com.project.api.domain.OrderStatus;
import com.project.api.service.OrderService;
import com.project.api.web.dto.OrderResponse;
import com.project.api.web.dto.PageResponse;
import com.project.api.web.dto.SellerOrderQueue;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/seller/orders")
@RequiredArgsConstructor
public class SellerOrderController {

    private final OrderService orderService;

    @GetMapping
    public PageResponse<OrderResponse> mySellerOrders(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) SellerOrderQueue queue,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Long sellerId = Long.parseLong(user.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        LocalDateTime fromDt = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDt = to != null ? to.atTime(LocalTime.MAX).plusNanos(1) : null;
        if (queue != null) {
            if (fromDt != null && toDt != null) {
                return PageResponse.of(orderService.getSellerOrdersByQueue(sellerId, queue, fromDt, toDt, pageable));
            }
            return PageResponse.of(orderService.getSellerOrdersByQueue(sellerId, queue, pageable));
        }
        if (fromDt != null && toDt != null) {
            if (status != null) {
                return PageResponse.of(orderService.getSellerOrders(sellerId, status, fromDt, toDt, pageable));
            }
            return PageResponse.of(orderService.getSellerOrders(sellerId, fromDt, toDt, pageable));
        }
        if (status != null) {
            return PageResponse.of(orderService.getSellerOrders(sellerId, status, pageable));
        }
        return PageResponse.of(orderService.getSellerOrders(sellerId, pageable));
    }
}
