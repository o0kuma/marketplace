package com.project.api.service;

import com.project.api.domain.OrderStatus;
import com.project.api.repository.OrderRepository;
import com.project.api.repository.ProductRepository;
import com.project.api.web.dto.SellerStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SellerService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public SellerStatsResponse getStats(Long sellerId) {
        long productCount = productRepository.countBySellerId(sellerId);
        long orderCount = orderRepository.countBySellerId(sellerId);
        long pendingOrderCount = orderRepository.countBySellerIdAndStatusNotIn(
                sellerId, List.of(OrderStatus.COMPLETE, OrderStatus.CANCELLED));

        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.atTime(LocalTime.MAX).plusNanos(1);
        LocalDate weekStartDate = today.with(DayOfWeek.MONDAY);
        LocalDateTime weekStart = weekStartDate.atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        long todayOrderCount = orderRepository.countBySellerIdAndCreatedAtBetween(sellerId, todayStart, todayEnd);
        long weekOrderCount = orderRepository.countBySellerIdAndCreatedAtBetween(sellerId, weekStart, now);
        long todaySales = orderRepository.sumSalesBySellerIdAndOrderCreatedAtBetween(sellerId, todayStart, todayEnd);
        long weekSales = orderRepository.sumSalesBySellerIdAndOrderCreatedAtBetween(sellerId, weekStart, now);

        return SellerStatsResponse.builder()
                .productCount(productCount)
                .orderCount(orderCount)
                .pendingOrderCount(pendingOrderCount)
                .todayOrderCount(todayOrderCount)
                .weekOrderCount(weekOrderCount)
                .todaySales(todaySales)
                .weekSales(weekSales)
                .build();
    }
}
