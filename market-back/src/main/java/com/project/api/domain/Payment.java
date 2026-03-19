package com.project.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private Integer amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(length = 100)
    private String pgTransactionId;

    @Builder
    public Payment(Order order, Integer amount, PaymentStatus status, String pgTransactionId) {
        this.order = order;
        this.amount = amount;
        this.status = status != null ? status : PaymentStatus.PENDING;
        this.pgTransactionId = pgTransactionId;
    }

    public void markRefunded() {
        this.status = PaymentStatus.REFUNDED;
    }
}
