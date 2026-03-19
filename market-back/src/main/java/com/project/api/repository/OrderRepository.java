package com.project.api.repository;

import com.project.api.domain.Order;
import com.project.api.domain.OrderStatus;
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

    @Query("select distinct o from Order o join o.items i where i.product.seller.id = :sellerId and o.createdAt >= :from and o.createdAt < :to order by o.createdAt desc")
    Page<Order> findBySellerIdAndCreatedAtBetween(@Param("sellerId") Long sellerId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

    @Query("select distinct o from Order o join o.items i where i.product.seller.id = :sellerId and o.status = :status and o.createdAt >= :from and o.createdAt < :to order by o.createdAt desc")
    Page<Order> findBySellerIdAndStatusAndCreatedAtBetween(@Param("sellerId") Long sellerId, @Param("status") OrderStatus status, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);
}
