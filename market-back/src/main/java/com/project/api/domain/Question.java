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
public class Question extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private Member author;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(columnDefinition = "TEXT")
    private String sellerAnswer;

    @Column
    private LocalDateTime answeredAt;

    @Builder
    public Question(Product product, Member author, String content) {
        this.product = product;
        this.author = author;
        this.content = content;
    }

    public void setSellerAnswer(String sellerAnswer) {
        this.sellerAnswer = sellerAnswer;
        this.answeredAt = LocalDateTime.now();
    }
}
