package com.project.api.web;

import com.project.api.service.OrderService;
import com.project.api.service.PaymentService;
import com.project.api.web.dto.OrderRequest;
import com.project.api.web.dto.OrderResponse;
import com.project.api.web.dto.OrderStatusRequest;
import com.project.api.web.dto.PageResponse;
import com.project.api.web.dto.PaymentConfirmRequest;
import com.project.api.web.dto.PaymentRequest;
import com.project.api.web.dto.TrackingRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final PaymentService paymentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody OrderRequest request) {
        Long buyerId = Long.parseLong(user.getUsername());
        return orderService.create(buyerId, request);
    }

    @GetMapping
    public PageResponse<OrderResponse> myOrders(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long buyerId = Long.parseLong(user.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        return PageResponse.of(orderService.getMyOrders(buyerId, pageable));
    }

    @GetMapping("/{id}")
    public OrderResponse getById(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        Long memberId = Long.parseLong(user.getUsername());
        return orderService.getById(id, memberId);
    }

    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        return orderService.updateStatus(id, memberId, request);
    }

    @PatchMapping("/{id}/tracking")
    public OrderResponse updateTracking(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody TrackingRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        return orderService.updateTrackingNumber(id, memberId, request != null ? request.getTrackingNumber() : null);
    }

    @PostMapping("/{id}/pay")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void pay(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody PaymentRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        paymentService.requestPayment(id, memberId, request);
    }

    /** Toss Payments: confirm after client-side payment success. */
    @PostMapping("/{id}/pay/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void payConfirm(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody PaymentConfirmRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        paymentService.confirmTossPayment(id, memberId, request);
    }

    @PostMapping("/{id}/refund")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void refund(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        Long memberId = Long.parseLong(user.getUsername());
        paymentService.refund(id, memberId);
    }

    @PostMapping("/{id}/refund/seller")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void refundBySeller(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        Long sellerId = Long.parseLong(user.getUsername());
        paymentService.refundBySeller(id, sellerId);
    }
}
