package com.project.api.web;

import com.project.api.domain.ProductStatus;
import com.project.api.service.ProductService;
import com.project.api.web.dto.BulkProductStatusRequest;
import com.project.api.web.dto.PageResponse;
import com.project.api.web.dto.ProductResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/products")
@RequiredArgsConstructor
public class SellerProductController {

    private final ProductService productService;

    @PatchMapping("/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void bulkUpdateStatus(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody BulkProductStatusRequest request) {
        Long sellerId = Long.parseLong(user.getUsername());
        if (request.getStatus() == ProductStatus.DELETED) {
            throw new IllegalArgumentException("Use delete API for deletion");
        }
        productService.updateStatusBulk(sellerId, request.getProductIds(), request.getStatus());
    }

    @GetMapping
    public PageResponse<ProductResponse> myProducts(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) ProductStatus status) {
        Long sellerId = Long.parseLong(user.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        if (status != null) {
            return PageResponse.of(productService.getBySellerId(sellerId, status, pageable));
        }
        return PageResponse.of(productService.getBySellerId(sellerId, pageable));
    }
}
