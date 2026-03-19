package com.project.api.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Admin dashboard: period stats and recent items.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsResponse {

    private long memberCount;
    private long productCount;
    private long orderCount;

    private long todayMembers;
    private long weekMembers;
    private long monthMembers;
    private long todayProducts;
    private long weekProducts;
    private long monthProducts;
    private long todayOrders;
    private long weekOrders;
    private long monthOrders;
    private long todaySales;
    private long weekSales;
    private long monthSales;

    private List<MemberSummary> recentMembers;
    private List<ProductSummary> recentProducts;
    private List<OrderSummary> recentOrders;

    /** Last N days, ascending by date (for dashboard charts). */
    private List<DailyTrendPoint> dailyTrend;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberSummary {
        private Long id;
        private String name;
        private String email;
        private String role;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductSummary {
        private Long id;
        private String name;
        private String status;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderSummary {
        private Long id;
        private Integer totalAmount;
        private String status;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyTrendPoint {
        private String date;
        private long orderCount;
        private long sales;
    }
}
