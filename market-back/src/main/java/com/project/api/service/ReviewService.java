package com.project.api.service;

import com.project.api.domain.Member;
import com.project.api.domain.Order;
import com.project.api.domain.OrderItem;
import com.project.api.domain.OrderStatus;
import com.project.api.domain.Review;
import com.project.api.repository.OrderItemRepository;
import com.project.api.repository.ReviewRepository;
import com.project.api.web.ForbiddenException;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.MyReviewResponse;
import com.project.api.web.dto.PageResponse;
import com.project.api.web.dto.ReviewCreateRequest;
import com.project.api.web.dto.ReviewResponse;
import com.project.api.web.dto.ReviewUpdateRequest;
import com.project.api.web.dto.ReviewableOrderItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderItemRepository orderItemRepository;
    private final MemberService memberService;

    public List<ReviewResponse> list(Long productId, Pageable pageable) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable)
                .map(ReviewResponse::from)
                .getContent();
    }

    public PageResponse<MyReviewResponse> getMyReviews(Long memberId, Pageable pageable) {
        Page<Review> page = reviewRepository.findByAuthorIdOrderByCreatedAtDesc(memberId, pageable);
        return PageResponse.of(page.map(MyReviewResponse::from));
    }

    public PageResponse<ReviewResponse> getBySellerProduct(Long sellerId, Pageable pageable) {
        Page<Review> page = reviewRepository.findByProduct_Seller_IdOrderByCreatedAtDesc(sellerId, pageable);
        return PageResponse.of(page.map(ReviewResponse::from));
    }

    @Transactional
    public ReviewResponse setSellerReply(Long reviewId, Long sellerId, String reply) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new com.project.api.web.NotFoundException("Review not found: " + reviewId));
        if (!review.getProduct().getSeller().getId().equals(sellerId)) {
            throw new com.project.api.web.ForbiddenException("Not the product seller");
        }
        review.setSellerReply(reply != null ? reply.trim() : null);
        return ReviewResponse.from(review);
    }

    public List<ReviewableOrderItemResponse> getReviewableOrderItems(Long memberId, Long productId) {
        List<OrderItem> items = orderItemRepository.findByOrderBuyerIdAndOrderStatusAndProductId(
                memberId, OrderStatus.COMPLETE, productId);
        return items.stream()
                .filter(oi -> !reviewRepository.existsByOrderItemId(oi.getId()))
                .map(ReviewableOrderItemResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReviewResponse create(Long productId, Long memberId, ReviewCreateRequest request) {
        Member author = memberService.findById(memberId);
        OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> new NotFoundException("Order item not found: " + request.getOrderItemId()));
        Order order = orderItem.getOrder();
        if (!order.getBuyer().getId().equals(memberId)) {
            throw new ForbiddenException("Not the buyer of this order");
        }
        if (order.getStatus() != OrderStatus.COMPLETE) {
            throw new IllegalArgumentException("Can only review after order is complete");
        }
        if (!orderItem.getProduct().getId().equals(productId)) {
            throw new IllegalArgumentException("Order item does not belong to this product");
        }
        if (reviewRepository.existsByOrderItemId(orderItem.getId())) {
            throw new IllegalArgumentException("Review already exists for this order item");
        }
        Review review = Review.builder()
                .product(orderItem.getProduct())
                .author(author)
                .orderItem(orderItem)
                .rating(request.getRating())
                .content(request.getContent() != null ? request.getContent() : "")
                .build();
        review = reviewRepository.save(review);
        return ReviewResponse.from(review);
    }

    @Transactional
    public ReviewResponse update(Long reviewId, Long memberId, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found: " + reviewId));
        if (!review.getAuthor().getId().equals(memberId)) {
            throw new ForbiddenException("Not the author of this review");
        }
        review.update(request.getRating(), request.getContent());
        return ReviewResponse.from(review);
    }

    @Transactional
    public void delete(Long reviewId, Long memberId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found: " + reviewId));
        if (!review.getAuthor().getId().equals(memberId)) {
            throw new ForbiddenException("Not the author of this review");
        }
        reviewRepository.delete(review);
    }
}
