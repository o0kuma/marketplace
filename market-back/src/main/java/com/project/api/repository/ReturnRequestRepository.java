package com.project.api.repository;

import com.project.api.domain.ReturnRequest;
import com.project.api.domain.ReturnRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    List<ReturnRequest> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    @Query("""
            select count(distinct rr.id) from ReturnRequest rr
            join rr.order o
            join o.items i
            where i.product.seller.id = :sellerId
              and rr.status = :status
            """)
    long countBySellerIdAndStatus(
            @Param("sellerId") Long sellerId,
            @Param("status") ReturnRequestStatus status);
}
