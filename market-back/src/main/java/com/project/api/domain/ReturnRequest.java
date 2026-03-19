package com.project.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "return_requests")
public class ReturnRequest extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReturnRequestType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReturnRequestStatus status = ReturnRequestStatus.REQUESTED;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Column(length = 500)
    private String sellerComment;

    @Builder
    public ReturnRequest(Order order, ReturnRequestType type, String reason) {
        this.order = order;
        this.type = type;
        this.reason = reason != null ? reason : "";
    }

    public void setStatus(ReturnRequestStatus status) {
        this.status = status;
    }

    public void setSellerComment(String sellerComment) {
        this.sellerComment = sellerComment;
    }
}
