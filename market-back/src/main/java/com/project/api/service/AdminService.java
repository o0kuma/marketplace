package com.project.api.service;

import com.project.api.domain.*;
import com.project.api.repository.MemberRepository;
import com.project.api.repository.OrderRepository;
import com.project.api.repository.ProductRepository;
import com.project.api.web.dto.AdminStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final MemberRepository memberRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public AdminStatsResponse getStats() {
        long memberCount = memberRepository.countByDeletedAtIsNull();
        long productCount = productRepository.count();
        long orderCount = orderRepository.count();

        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.atTime(LocalTime.MAX).plusNanos(1);
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        LocalDateTime weekStartDt = weekStart.atStartOfDay();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDateTime monthStartDt = monthStart.atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        long todayMembers = memberRepository.countByCreatedAtBetween(todayStart, todayEnd);
        long weekMembers = memberRepository.countByCreatedAtBetween(weekStartDt, now);
        long monthMembers = memberRepository.countByCreatedAtBetween(monthStartDt, now);
        long todayProducts = productRepository.countByCreatedAtBetween(todayStart, todayEnd);
        long weekProducts = productRepository.countByCreatedAtBetween(weekStartDt, now);
        long monthProducts = productRepository.countByCreatedAtBetween(monthStartDt, now);
        long todayOrders = orderRepository.countByCreatedAtBetween(todayStart, todayEnd);
        long weekOrders = orderRepository.countByCreatedAtBetween(weekStartDt, now);
        long monthOrders = orderRepository.countByCreatedAtBetween(monthStartDt, now);
        long todaySales = orderRepository.sumTotalAmountByCreatedAtBetween(todayStart, todayEnd);
        long weekSales = orderRepository.sumTotalAmountByCreatedAtBetween(weekStartDt, now);
        long monthSales = orderRepository.sumTotalAmountByCreatedAtBetween(monthStartDt, now);

        List<AdminStatsResponse.MemberSummary> recentMembers = memberRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5))
                .getContent().stream()
                .map(m -> new AdminStatsResponse.MemberSummary(m.getId(), m.getName(), m.getEmail(), m.getRole().name()))
                .collect(Collectors.toList());
        List<AdminStatsResponse.ProductSummary> recentProducts = productRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5))
                .getContent().stream()
                .map(p -> new AdminStatsResponse.ProductSummary(p.getId(), p.getName(), p.getStatus().name()))
                .collect(Collectors.toList());
        List<AdminStatsResponse.OrderSummary> recentOrders = orderRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5))
                .getContent().stream()
                .map(o -> new AdminStatsResponse.OrderSummary(o.getId(), o.getTotalAmount(), o.getStatus().name()))
                .collect(Collectors.toList());

        List<AdminStatsResponse.DailyTrendPoint> dailyTrend = new ArrayList<>();
        DateTimeFormatter dayFmt = DateTimeFormatter.ISO_LOCAL_DATE;
        for (int i = 13; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            LocalDateTime dayStart = d.atStartOfDay();
            LocalDateTime dayEnd = d.plusDays(1).atStartOfDay();
            long dayOrders = orderRepository.countByCreatedAtGreaterThanEqualAndCreatedAtBefore(dayStart, dayEnd);
            long daySales = orderRepository.sumTotalAmountByCreatedAtBetween(dayStart, dayEnd);
            dailyTrend.add(new AdminStatsResponse.DailyTrendPoint(d.format(dayFmt), dayOrders, daySales));
        }

        return AdminStatsResponse.builder()
                .memberCount(memberCount)
                .productCount(productCount)
                .orderCount(orderCount)
                .todayMembers(todayMembers)
                .weekMembers(weekMembers)
                .monthMembers(monthMembers)
                .todayProducts(todayProducts)
                .weekProducts(weekProducts)
                .monthProducts(monthProducts)
                .todayOrders(todayOrders)
                .weekOrders(weekOrders)
                .monthOrders(monthOrders)
                .todaySales(todaySales)
                .weekSales(weekSales)
                .monthSales(monthSales)
                .recentMembers(recentMembers)
                .recentProducts(recentProducts)
                .recentOrders(recentOrders)
                .dailyTrend(dailyTrend)
                .build();
    }
}
