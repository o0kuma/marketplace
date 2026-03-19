package com.project.api.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Seller dashboard summary: product count, order counts, today/week stats.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerStatsResponse {

    private long productCount;
    private long orderCount;
    /** Orders not yet complete (ORDERED, PAYMENT_COMPLETE, SHIPPING). */
    private long pendingOrderCount;
    private long todayOrderCount;
    private long weekOrderCount;
    private long todaySales;
    private long weekSales;
}
