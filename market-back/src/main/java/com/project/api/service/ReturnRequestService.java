package com.project.api.service;

import com.project.api.domain.*;
import com.project.api.repository.OrderRepository;
import com.project.api.repository.ReturnRequestRepository;
import com.project.api.web.ForbiddenException;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.ReturnRequestCreateRequest;
import com.project.api.web.dto.ReturnRequestResponse;
import com.project.api.web.dto.ReturnRequestUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReturnRequestService {

    private final OrderRepository orderRepository;
    private final ReturnRequestRepository returnRequestRepository;

    @Transactional
    public ReturnRequestResponse create(Long orderId, Long memberId, ReturnRequestCreateRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (!order.getBuyer().getId().equals(memberId)) {
            throw new ForbiddenException("Only the buyer can request return or exchange");
        }
        if (order.getStatus() == OrderStatus.ORDERED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Return/exchange not available for this order status");
        }
        String reason = request.getReason() != null ? request.getReason().trim() : "";
        if (reason.length() > 1000) reason = reason.substring(0, 1000);
        ReturnRequest rr = ReturnRequest.builder()
                .order(order)
                .type(request.getType())
                .reason(reason)
                .build();
        rr = returnRequestRepository.save(rr);
        return ReturnRequestResponse.from(rr);
    }

    public List<ReturnRequestResponse> listByOrder(Long orderId, Long memberId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        boolean isBuyer = order.getBuyer().getId().equals(memberId);
        boolean isSeller = order.hasItemFromSeller(memberId);
        if (!isBuyer && !isSeller) {
            throw new ForbiddenException("Not the order buyer or seller");
        }
        return returnRequestRepository.findByOrderIdOrderByCreatedAtDesc(orderId).stream()
                .map(ReturnRequestResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReturnRequestResponse updateStatus(Long orderId, Long returnRequestId, Long memberId,
                                              ReturnRequestUpdateRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (!order.hasItemFromSeller(memberId)) {
            throw new ForbiddenException("Only a seller of this order can approve or reject");
        }
        ReturnRequest rr = returnRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new NotFoundException("Return request not found: " + returnRequestId));
        if (!rr.getOrder().getId().equals(orderId)) {
            throw new IllegalArgumentException("Return request does not belong to this order");
        }
        if (rr.getStatus() != ReturnRequestStatus.REQUESTED) {
            throw new IllegalArgumentException("Only REQUESTED status can be updated");
        }
        if (request.getStatus() != ReturnRequestStatus.APPROVED && request.getStatus() != ReturnRequestStatus.REJECTED) {
            throw new IllegalArgumentException("Status must be APPROVED or REJECTED");
        }
        rr.setStatus(request.getStatus());
        if (request.getSellerComment() != null) {
            rr.setSellerComment(request.getSellerComment().length() > 500
                    ? request.getSellerComment().substring(0, 500) : request.getSellerComment());
        }
        return ReturnRequestResponse.from(rr);
    }
}
