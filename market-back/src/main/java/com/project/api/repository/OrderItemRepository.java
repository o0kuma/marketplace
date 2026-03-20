package com.project.api.repository;

import com.project.api.domain.OrderItem;
import com.project.api.domain.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("select oi from OrderItem oi where oi.order.buyer.id = :buyerId and oi.order.status = :status and oi.product.id = :productId")
    List<OrderItem> findByOrderBuyerIdAndOrderStatusAndProductId(
            @Param("buyerId") Long buyerId,
            @Param("status") OrderStatus status,
            @Param("productId") Long productId);

    boolean existsByProductVariantId(Long productVariantId);
}
