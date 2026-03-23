package com.project.api.service;

import com.project.api.config.MarketShippingProperties;
import com.project.api.domain.*;
import com.project.api.repository.OrderRepository;
import com.project.api.repository.PaymentRepository;
import com.project.api.repository.ProductRepository;
import com.project.api.repository.ProductVariantRepository;
import com.project.api.web.ForbiddenException;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.OrderRequest;
import com.project.api.web.dto.OrderResponse;
import com.project.api.web.dto.OrderStatusRequest;
import com.project.api.web.dto.SellerOrderQueue;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private static final java.util.List<OrderStatus> SELLER_PENDING_EXCLUDED =
            java.util.List.of(OrderStatus.COMPLETE, OrderStatus.CANCELLED);
    private static final java.util.List<OrderStatus> PENDING_SHIPMENT_STATUSES =
            java.util.List.of(OrderStatus.PAYMENT_COMPLETE, OrderStatus.SHIPPING);

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final PaymentRepository paymentRepository;
    private final MemberService memberService;
    private final NotificationService notificationService;
    private final ShippingQuoteService shippingQuoteService;
    private final EmailService emailService;
    private final MarketShippingProperties marketShippingProperties;

    @Transactional
    public OrderResponse create(Long buyerId, OrderRequest request) {
        Member buyer = memberService.findById(buyerId);
        String shipCountry = ShippingCountry.normalize(request.getRecipientCountry());
        Order order = Order.builder()
                .buyer(buyer)
                .status(OrderStatus.ORDERED)
                .totalAmount(0)
                .shippingFee(0)
                .recipientName(request.getRecipientName())
                .recipientPhone(request.getRecipientPhone())
                .recipientAddress(request.getRecipientAddress())
                .recipientCountry(shipCountry)
                .build();
        int total = 0;
        java.util.Set<Long> productsWithVariantsToUpdate = new java.util.HashSet<>();
        for (var itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new NotFoundException("Product not found: " + itemReq.getProductId()));
            if (product.getStatus() == ProductStatus.DELETED) {
                throw new IllegalArgumentException("Product not available: " + product.getId());
            }
            int qty = itemReq.getQuantity();
            ProductVariant variant = null;
            int orderPrice;
            if (itemReq.getProductVariantId() != null) {
                variant = productVariantRepository.findById(itemReq.getProductVariantId())
                        .orElseThrow(() -> new NotFoundException("Variant not found: " + itemReq.getProductVariantId()));
                if (!variant.getProduct().getId().equals(product.getId())) {
                    throw new IllegalArgumentException("Variant does not belong to product");
                }
                if (variant.isSoldOut() || variant.getStockQuantity() < qty) {
                    throw new IllegalArgumentException("Insufficient stock: " + product.getName() + " (" + variant.getOptionSummary() + ")");
                }
                variant.decreaseStock(qty);
                orderPrice = variant.getPrice();
                productsWithVariantsToUpdate.add(product.getId());
            } else {
                if (product.hasVariants()) {
                    throw new IllegalArgumentException("Product has options; variant required: " + product.getName());
                }
                if (product.getStatus() == ProductStatus.SOLD_OUT) {
                    throw new IllegalArgumentException("Product sold out: " + product.getName());
                }
                product.decreaseStock(qty);
                orderPrice = product.getPrice();
            }
            OrderItem item = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productVariant(variant)
                    .quantity(qty)
                    .orderPrice(orderPrice)
                    .build();
            order.addItem(item);
            total += orderPrice * qty;
        }
        int shipping = shippingQuoteService.feeForSubtotal(total, shipCountry);
        order.setShippingFee(shipping);
        order.setTotalAmount(total + shipping);
        Order saved = orderRepository.save(order);
        for (Long productId : productsWithVariantsToUpdate) {
            productRepository.findById(productId).ifPresent(Product::updateStatusFromVariants);
        }
        saved = orderRepository.findById(saved.getId()).orElseThrow();
        emailService.sendOrderConfirmationEmail(
                saved.getBuyer().getEmail(),
                saved.getBuyer().getName(),
                saved);
        return toOrderResponse(saved);
    }

    public Page<OrderResponse> getMyOrders(Long buyerId, Pageable pageable) {
        return orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId, pageable)
                .map(this::toOrderResponse);
    }

    public OrderResponse getById(Long orderId, Long memberId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        boolean isBuyer = order.getBuyer().getId().equals(memberId);
        boolean isSeller = order.hasItemFromSeller(memberId);
        if (!isBuyer && !isSeller) {
            throw new ForbiddenException("Not the order buyer or seller");
        }
        return toOrderResponse(order);
    }

    /** Admin: get any order by id. */
    public OrderResponse getByIdForAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        return toOrderResponse(order);
    }

    /** Admin: list all orders with optional status and date range. */
    public Page<OrderResponse> getOrdersForAdmin(OrderStatus status, java.time.LocalDateTime from, java.time.LocalDateTime to, Pageable pageable) {
        if (from != null && to != null) {
            if (status != null) {
                return orderRepository.findByStatusAndCreatedAtBetweenOrderByCreatedAtDesc(status, from, to, pageable).map(this::toOrderResponse);
            }
            return orderRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to, pageable).map(this::toOrderResponse);
        }
        if (status != null) {
            return orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable).map(this::toOrderResponse);
        }
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toOrderResponse);
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, Long memberId, OrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        OrderStatus newStatus = request.getStatus();
        if (newStatus == OrderStatus.CANCELLED) {
            if (!order.getBuyer().getId().equals(memberId)) {
                throw new ForbiddenException("Only buyer can cancel");
            }
            if (order.getStatus() != OrderStatus.ORDERED) {
                throw new IllegalArgumentException("Can only cancel ORDERED status");
            }
        } else {
            if (!order.hasItemFromSeller(memberId)) {
                throw new ForbiddenException("Not a seller of this order");
            }
            if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.COMPLETE) {
                throw new IllegalArgumentException("Cannot change status");
            }
            if (newStatus == OrderStatus.ORDERED || newStatus == OrderStatus.PAYMENT_COMPLETE) {
                throw new IllegalArgumentException("Seller cannot set order or payment status");
            }
            if (newStatus == OrderStatus.SHIPPING && order.getStatus() != OrderStatus.PAYMENT_COMPLETE) {
                throw new IllegalArgumentException("Set shipping only after payment is complete");
            }
            if (newStatus == OrderStatus.SHIPPING && !order.hasTrackingNumber()) {
                throw new IllegalArgumentException("Enter tracking number before marking as shipping");
            }
            if (newStatus == OrderStatus.COMPLETE && order.getStatus() != OrderStatus.SHIPPING) {
                throw new IllegalArgumentException("Complete only after shipping");
            }
            if (newStatus == OrderStatus.COMPLETE && !order.hasTrackingNumber()) {
                throw new IllegalArgumentException("Enter tracking number before completing delivery");
            }
        }
        order.setStatus(newStatus);
        notificationService.notifyOrderStatusChange(order, newStatus);
        if (newStatus == OrderStatus.SHIPPING) {
            emailService.sendShippingNoticeEmail(
                    order.getBuyer().getEmail(),
                    order.getBuyer().getName(),
                    order);
        }
        return toOrderResponse(order);
    }

    public Page<OrderResponse> getSellerOrders(Long sellerId, Pageable pageable) {
        return orderRepository.findBySellerId(sellerId, pageable).map(this::toOrderResponse);
    }

    public Page<OrderResponse> getSellerOrders(Long sellerId, OrderStatus status, Pageable pageable) {
        return orderRepository.findBySellerIdAndStatus(sellerId, status, pageable).map(this::toOrderResponse);
    }

    public Page<OrderResponse> getSellerOrders(Long sellerId, java.time.LocalDateTime from, java.time.LocalDateTime to, Pageable pageable) {
        return orderRepository.findBySellerIdAndCreatedAtBetween(sellerId, from, to, pageable).map(this::toOrderResponse);
    }

    public Page<OrderResponse> getSellerOrders(Long sellerId, OrderStatus status, java.time.LocalDateTime from, java.time.LocalDateTime to, Pageable pageable) {
        return orderRepository.findBySellerIdAndStatusAndCreatedAtBetween(sellerId, status, from, to, pageable).map(this::toOrderResponse);
    }

    /** Dashboard presets: pending (not complete/cancelled), pending shipment, open return requests. */
    public Page<OrderResponse> getSellerOrdersByQueue(Long sellerId, SellerOrderQueue queue, Pageable pageable) {
        Page<Order> page = switch (queue) {
            case PENDING -> orderRepository.findBySellerIdAndStatusNotIn(sellerId, SELLER_PENDING_EXCLUDED, pageable);
            case PENDING_SHIPMENT -> orderRepository.findBySellerIdAndStatusInAndTrackingEmpty(
                    sellerId, PENDING_SHIPMENT_STATUSES, pageable);
            case RETURN_REQUESTED -> orderRepository.findBySellerIdHavingReturnRequestStatus(
                    sellerId, ReturnRequestStatus.REQUESTED, pageable);
        };
        return page.map(this::toOrderResponse);
    }

    public Page<OrderResponse> getSellerOrdersByQueue(
            Long sellerId, SellerOrderQueue queue, java.time.LocalDateTime from, java.time.LocalDateTime to, Pageable pageable) {
        Page<Order> page = switch (queue) {
            case PENDING -> orderRepository.findBySellerIdAndStatusNotInAndCreatedAtBetween(
                    sellerId, SELLER_PENDING_EXCLUDED, from, to, pageable);
            case PENDING_SHIPMENT -> orderRepository.findBySellerIdAndStatusInAndTrackingEmptyAndCreatedAtBetween(
                    sellerId, PENDING_SHIPMENT_STATUSES, from, to, pageable);
            case RETURN_REQUESTED -> orderRepository.findBySellerIdHavingReturnRequestStatusAndCreatedAtBetween(
                    sellerId, ReturnRequestStatus.REQUESTED, from, to, pageable);
        };
        return page.map(this::toOrderResponse);
    }

    @Transactional
    public OrderResponse updateTrackingNumber(Long orderId, Long memberId, String trackingNumber) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (!order.hasItemFromSeller(memberId)) {
            throw new ForbiddenException("Not a seller of this order");
        }
        order.setTrackingNumber(trackingNumber != null ? trackingNumber.trim() : null);
        return toOrderResponse(order);
    }

    private OrderResponse toOrderResponse(Order order) {
        boolean refunded = paymentRepository.existsByOrderIdAndStatus(order.getId(), PaymentStatus.REFUNDED);
        boolean domestic = ShippingCountry.isDomestic(
                order.recipientCountryOrDefault(), marketShippingProperties.getDomesticCountry());
        return OrderResponse.from(order, refunded, domestic);
    }
}
