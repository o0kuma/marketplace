package com.project.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private Member author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String sellerReply;

    @Column
    private LocalDateTime repliedAt;

    @Builder
    public Review(Product product, Member author, OrderItem orderItem, Integer rating, String content) {
        this.product = product;
        this.author = author;
        this.orderItem = orderItem;
        this.rating = rating;
        this.content = content;
    }

    public void update(Integer rating, String content) {
        if (rating != null) this.rating = rating;
        if (content != null) this.content = content;
    }

    public void setSellerReply(String sellerReply) {
        this.sellerReply = sellerReply;
        this.repliedAt = LocalDateTime.now();
    }
}
