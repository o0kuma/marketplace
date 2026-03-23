package com.project.api.web.dto;

/**
 * Seller order list presets aligned with dashboard stats (see {@link com.project.api.service.SellerService}).
 */
public enum SellerOrderQueue {
    /** Orders not completed or cancelled (action still needed). */
    PENDING,
    /** Paid or shipping but tracking number not entered. */
    PENDING_SHIPMENT,
    /** Orders with at least one return/exchange request in REQUESTED status. */
    RETURN_REQUESTED
}
