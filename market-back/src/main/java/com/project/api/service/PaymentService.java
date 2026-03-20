package com.project.api.service;

import com.project.api.domain.Order;
import com.project.api.domain.OrderStatus;
import com.project.api.domain.Payment;
import com.project.api.domain.PaymentStatus;
import com.project.api.payment.TossPaymentService;
import com.project.api.repository.OrderRepository;
import com.project.api.repository.PaymentRepository;
import com.project.api.web.ForbiddenException;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.PaymentConfirmRequest;
import com.project.api.web.dto.PaymentRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Payment: Toss Payments confirm when configured; otherwise stub. Webhook path for server-to-server confirm.
 */
@Service
@Transactional(readOnly = true)
public class PaymentService {

    private static final String TOSS_ORDER_PREFIX = "order-";

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final TossPaymentService tossPaymentService;
    private final EmailService emailService;

    @Value("${app.payment.webhook-secret:}")
    private String webhookSecret;
    @Value("${app.payment.toss.allow-duplicate-order-id-bypass:false}")
    private boolean allowDuplicateOrderIdBypass;

    public PaymentService(OrderRepository orderRepository,
                          PaymentRepository paymentRepository,
                          NotificationService notificationService,
                          TossPaymentService tossPaymentService,
                          EmailService emailService) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.notificationService = notificationService;
        this.tossPaymentService = tossPaymentService;
        this.emailService = emailService;
    }

    /** Toss orderId used when opening payment (must be 6–64 chars, alphanumeric, -, _). */
    public static String toTossOrderId(Long orderId) {
        return TOSS_ORDER_PREFIX + orderId;
    }

    public boolean isTossConfigured() {
        return tossPaymentService.isConfigured();
    }

    /**
     * Confirm payment with Toss (after client-side payment success). When Toss is not configured, throws.
     */
    @Transactional
    public void confirmTossPayment(Long orderId, Long memberId, PaymentConfirmRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (!order.getBuyer().getId().equals(memberId)) {
            throw new ForbiddenException("Not the order buyer");
        }
        if (order.getStatus() != OrderStatus.ORDERED) {
            throw new IllegalArgumentException("Order is not in ORDERED status");
        }
        if (!request.getOrderId().equals(toTossOrderId(orderId))) {
            throw new IllegalArgumentException("orderId mismatch");
        }
        if (!request.getAmount().equals(order.getTotalAmount())) {
            throw new IllegalArgumentException("Amount must match order total");
        }
        if (paymentRepository.findByOrderIdAndStatus(orderId, PaymentStatus.COMPLETED).isPresent()) {
            throw new IllegalArgumentException("Payment already completed");
        }
        if (!tossPaymentService.isConfigured()) {
            throw new IllegalStateException("Toss Payments is not configured");
        }
        String pgTransactionId;
        try {
            pgTransactionId = tossPaymentService.confirm(
                    request.getPaymentKey(),
                    request.getOrderId(),
                    request.getAmount()
            );
        } catch (IllegalArgumentException e) {
            boolean duplicatedOrderId = e.getMessage() != null && e.getMessage().contains("DUPLICATED_ORDER_ID");
            if (!allowDuplicateOrderIdBypass || !duplicatedOrderId) {
                throw e;
            }
            // Dev-only safety valve for repeated local tests: only DUPLICATED_ORDER_ID is bypassed.
            pgTransactionId = request.getPaymentKey();
        }
        Payment payment = Payment.builder()
                .order(order)
                .amount(request.getAmount())
                .status(PaymentStatus.COMPLETED)
                .pgTransactionId(pgTransactionId != null ? pgTransactionId : request.getPaymentKey())
                .build();
        paymentRepository.save(payment);
        order.setStatus(OrderStatus.PAYMENT_COMPLETE);
        notificationService.notifyOrderStatusChange(order, OrderStatus.PAYMENT_COMPLETE);
        emailService.sendPaymentCompleteEmail(
                order.getBuyer().getEmail(),
                order.getBuyer().getName(),
                order);
    }

    @Transactional
    public void requestPayment(Long orderId, Long memberId, PaymentRequest request) {
        if (tossPaymentService.isConfigured()) {
            throw new IllegalArgumentException("Use Toss payment flow: open payment window and then confirm with paymentKey");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (!order.getBuyer().getId().equals(memberId)) {
            throw new ForbiddenException("Not the order buyer");
        }
        if (order.getStatus() != OrderStatus.ORDERED) {
            throw new IllegalArgumentException("Order is not in ORDERED status");
        }
        if (request.getAmount() == null || !request.getAmount().equals(order.getTotalAmount())) {
            throw new IllegalArgumentException("Amount must match order total (including shipping)");
        }
        if (paymentRepository.findByOrderIdAndStatus(orderId, PaymentStatus.COMPLETED).isPresent()) {
            throw new IllegalArgumentException("Payment already completed");
        }
        String mockPgId = "pg-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        Payment payment = Payment.builder()
                .order(order)
                .amount(request.getAmount())
                .status(PaymentStatus.COMPLETED)
                .pgTransactionId(mockPgId)
                .build();
        paymentRepository.save(payment);
        order.setStatus(OrderStatus.PAYMENT_COMPLETE);
        notificationService.notifyOrderStatusChange(order, OrderStatus.PAYMENT_COMPLETE);
        emailService.sendPaymentCompleteEmail(
                order.getBuyer().getEmail(),
                order.getBuyer().getName(),
                order);
    }

    private boolean isTossPaymentKey(String pgTransactionId) {
        return pgTransactionId != null && !pgTransactionId.startsWith("pg-");
    }

    @Transactional
    public void refund(Long orderId, Long memberId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (!order.getBuyer().getId().equals(memberId)) {
            throw new ForbiddenException("Not the order buyer");
        }
        Payment payment = paymentRepository.findByOrderIdAndStatus(orderId, PaymentStatus.COMPLETED)
                .orElseThrow(() -> new NotFoundException("No completed payment for this order"));
        if (tossPaymentService.isConfigured() && isTossPaymentKey(payment.getPgTransactionId())) {
            tossPaymentService.cancel(payment.getPgTransactionId(), "고객 환불 요청");
        }
        payment.markRefunded();
        order.setStatus(OrderStatus.CANCELLED);
        notificationService.notifyOrderStatusChange(order, OrderStatus.CANCELLED);
    }

    /** Seller: process refund for an order that includes seller's product(s). */
    @Transactional
    public void refundBySeller(Long orderId, Long sellerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (!order.hasItemFromSeller(sellerId)) {
            throw new ForbiddenException("Not a seller of this order");
        }
        if (order.getStatus() != OrderStatus.PAYMENT_COMPLETE && order.getStatus() != OrderStatus.SHIPPING) {
            throw new IllegalArgumentException("Refund allowed only for paid or shipping orders");
        }
        Payment payment = paymentRepository.findByOrderIdAndStatus(orderId, PaymentStatus.COMPLETED)
                .orElseThrow(() -> new NotFoundException("No completed payment for this order"));
        if (tossPaymentService.isConfigured() && isTossPaymentKey(payment.getPgTransactionId())) {
            tossPaymentService.cancel(payment.getPgTransactionId(), "판매자 환불 처리");
        }
        payment.markRefunded();
        order.setStatus(OrderStatus.CANCELLED);
        notificationService.notifyOrderStatusChange(order, OrderStatus.CANCELLED);
    }

    /**
     * External PG webhook: marks order paid when shared secret matches.
     * Set app.payment.webhook-secret in production; disabled if blank.
     */
    @Transactional
    public void completeFromWebhook(Long orderId, int amountKrw, String pgTransactionId, String providedSecret) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new IllegalStateException("Payment webhook is not configured");
        }
        if (!webhookSecret.equals(providedSecret)) {
            throw new ForbiddenException("Invalid webhook credentials");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (order.getStatus() != OrderStatus.ORDERED) {
            throw new IllegalArgumentException("Order not awaiting payment");
        }
        if (amountKrw != order.getTotalAmount()) {
            throw new IllegalArgumentException("Amount mismatch");
        }
        if (pgTransactionId == null || pgTransactionId.isBlank()) {
            throw new IllegalArgumentException("pgTransactionId required");
        }
        if (paymentRepository.findByOrderIdAndStatus(orderId, PaymentStatus.COMPLETED).isPresent()) {
            return;
        }
        Payment payment = Payment.builder()
                .order(order)
                .amount(amountKrw)
                .status(PaymentStatus.COMPLETED)
                .pgTransactionId(pgTransactionId)
                .build();
        paymentRepository.save(payment);
        order.setStatus(OrderStatus.PAYMENT_COMPLETE);
        notificationService.notifyOrderStatusChange(order, OrderStatus.PAYMENT_COMPLETE);
        emailService.sendPaymentCompleteEmail(
                order.getBuyer().getEmail(),
                order.getBuyer().getName(),
                order);
    }

    /** Admin: refund without buyer check. */
    @Transactional
    public void refundByAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        Payment payment = paymentRepository.findByOrderIdAndStatus(orderId, PaymentStatus.COMPLETED)
                .orElseThrow(() -> new NotFoundException("No completed payment for this order"));
        if (tossPaymentService.isConfigured() && isTossPaymentKey(payment.getPgTransactionId())) {
            tossPaymentService.cancel(payment.getPgTransactionId(), "관리자 취소");
        }
        payment.markRefunded();
        order.setStatus(OrderStatus.CANCELLED);
        notificationService.notifyOrderStatusChange(order, OrderStatus.CANCELLED);
    }
}
