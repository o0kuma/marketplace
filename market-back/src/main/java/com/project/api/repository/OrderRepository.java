package com.project.api.repository;

import com.project.api.domain.Order;
import com.project.api.domain.OrderStatus;
import com.project.api.domain.ReturnRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    long countByCreatedAtGreaterThanEqualAndCreatedAtBefore(LocalDateTime fromInclusive, LocalDateTime toExclusive);

    @Query("select coalesce(sum(o.totalAmount), 0L) from Order o where o.createdAt >= :from and o.createdAt < :to")
    long sumTotalAmountByCreatedAtBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);

    Page<Order> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<Order> findByStatusAndCreatedAtBetweenOrderByCreatedAtDesc(OrderStatus status, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId, Pageable pageable);

    @Query("select distinct o from Order o join o.items i where i.product.seller.id = :sellerId order by o.createdAt desc")
    Page<Order> findBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);

    @Query("select distinct o from Order o join o.items i where i.product.seller.id = :sellerId and o.status = :status order by o.createdAt desc")
    Page<Order> findBySellerIdAndStatus(@Param("sellerId") Long sellerId, @Param("status") OrderStatus status, Pageable pageable);

    @Query("select count(distinct o) from Order o join o.items i where i.product.seller.id = :sellerId")
    long countBySellerId(@Param("sellerId") Long sellerId);

    @Query("select count(distinct o) from Order o join o.items i where i.product.seller.id = :sellerId and o.status not in :statuses")
    long countBySellerIdAndStatusNotIn(@Param("sellerId") Long sellerId, @Param("statuses") List<OrderStatus> statuses);

    @Query("select count(distinct o) from Order o join o.items i where i.product.seller.id = :sellerId and o.createdAt >= :from and o.createdAt < :to")
    long countBySellerIdAndCreatedAtBetween(@Param("sellerId") Long sellerId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("select coalesce(sum(i.quantity * i.orderPrice), 0L) from Order o join o.items i where i.product.seller.id = :sellerId and o.createdAt >= :from and o.createdAt < :to")
    long sumSalesBySellerIdAndOrderCreatedAtBetween(@Param("sellerId") Long sellerId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("select count(distinct o) from Order o join o.items i where i.product.seller.id = :sellerId and o.status = :status")
    long countBySellerIdAndStatus(@Param("sellerId") Long sellerId, @Param("status") OrderStatus status);

    @Query("""
            select count(distinct o) from Order o
            join o.items i
            where i.product.seller.id = :sellerId
              and o.status = :status
              and o.createdAt >= :from and o.createdAt < :to
            """)
    long countBySellerIdAndStatusAndCreatedAtBetween(
            @Param("sellerId") Long sellerId,
            @Param("status") OrderStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("""
            select count(distinct o) from Order o
            join o.items i
            where i.product.seller.id = :sellerId
              and o.status in :statuses
              and (o.trackingNumber is null or trim(o.trackingNumber) = '')
            """)
    long countBySellerIdAndStatusInAndTrackingEmpty(
            @Param("sellerId") Long sellerId,
            @Param("statuses") List<OrderStatus> statuses);

    @Query("select distinct o from Order o join o.items i where i.product.seller.id = :sellerId and o.createdAt >= :from and o.createdAt < :to order by o.createdAt desc")
    Page<Order> findBySellerIdAndCreatedAtBetween(@Param("sellerId") Long sellerId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

    @Query("select distinct o from Order o join o.items i where i.product.seller.id = :sellerId and o.status = :status and o.createdAt >= :from and o.createdAt < :to order by o.createdAt desc")
    Page<Order> findBySellerIdAndStatusAndCreatedAtBetween(@Param("sellerId") Long sellerId, @Param("status") OrderStatus status, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

    @Query("""
            select distinct o from Order o join o.items i
            where i.product.seller.id = :sellerId
              and o.status not in :excluded
            order by o.createdAt desc
            """)
    Page<Order> findBySellerIdAndStatusNotIn(
            @Param("sellerId") Long sellerId,
            @Param("excluded") List<OrderStatus> excluded,
            Pageable pageable);

    @Query("""
            select distinct o from Order o join o.items i
            where i.product.seller.id = :sellerId
              and o.status not in :excluded
              and o.createdAt >= :from and o.createdAt < :to
            order by o.createdAt desc
            """)
    Page<Order> findBySellerIdAndStatusNotInAndCreatedAtBetween(
            @Param("sellerId") Long sellerId,
            @Param("excluded") List<OrderStatus> excluded,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    @Query("""
            select distinct o from Order o join o.items i
            where i.product.seller.id = :sellerId
              and o.status in :statuses
              and (o.trackingNumber is null or trim(o.trackingNumber) = '')
            order by o.createdAt desc
            """)
    Page<Order> findBySellerIdAndStatusInAndTrackingEmpty(
            @Param("sellerId") Long sellerId,
            @Param("statuses") List<OrderStatus> statuses,
            Pageable pageable);

    @Query("""
            select distinct o from Order o join o.items i
            where i.product.seller.id = :sellerId
              and o.status in :statuses
              and (o.trackingNumber is null or trim(o.trackingNumber) = '')
              and o.createdAt >= :from and o.createdAt < :to
            order by o.createdAt desc
            """)
    Page<Order> findBySellerIdAndStatusInAndTrackingEmptyAndCreatedAtBetween(
            @Param("sellerId") Long sellerId,
            @Param("statuses") List<OrderStatus> statuses,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    @Query("""
            select distinct o from Order o
            join o.items i
            where i.product.seller.id = :sellerId
              and exists (select 1 from ReturnRequest rr where rr.order = o and rr.status = :rrStatus)
            order by o.createdAt desc
            """)
    Page<Order> findBySellerIdHavingReturnRequestStatus(
            @Param("sellerId") Long sellerId,
            @Param("rrStatus") ReturnRequestStatus rrStatus,
            Pageable pageable);

    @Query("""
            select distinct o from Order o
            join o.items i
            where i.product.seller.id = :sellerId
              and exists (select 1 from ReturnRequest rr where rr.order = o and rr.status = :rrStatus)
              and o.createdAt >= :from and o.createdAt < :to
            order by o.createdAt desc
            """)
    Page<Order> findBySellerIdHavingReturnRequestStatusAndCreatedAtBetween(
            @Param("sellerId") Long sellerId,
            @Param("rrStatus") ReturnRequestStatus rrStatus,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);
}
