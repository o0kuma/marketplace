package com.project.api.web;

import com.project.api.domain.ProductStatus;
import com.project.api.service.AdminActionLogService;
import com.project.api.service.ProductService;
import com.project.api.web.dto.AdminProductBulkStatusRequest;
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
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;
    private final AdminActionLogService adminActionLogService;

    @GetMapping
    public PageResponse<ProductResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "true") boolean includeDeleted,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword) {
        Pageable pageable = PageRequest.of(page, size);
        return PageResponse.of(productService.listForAdmin(includeDeleted, status, categoryId, keyword, pageable));
    }

    @PatchMapping("/{id}/status")
    public ProductResponse setStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestParam ProductStatus status,
            @RequestParam(required = false) String reason) {
        ProductResponse res = productService.setStatusByAdmin(id, status);
        Long adminId = Long.parseLong(user.getUsername());
        adminActionLogService.log(
                adminId,
                "PRODUCT_STATUS_CHANGE",
                "PRODUCT",
                id,
                reason,
                "status=" + status);
        return res;
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable Long id) {
        return productService.getByIdForAdmin(id);
    }

    @PatchMapping("/status/bulk")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void bulkStatus(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody AdminProductBulkStatusRequest request,
            @RequestParam(required = false) String reason
    ) {
        Long adminId = Long.parseLong(user.getUsername());
        productService.updateStatusBulkByAdmin(request.getProductIds(), request.getStatus());
        adminActionLogService.log(
                adminId,
                "PRODUCT_STATUS_BULK_CHANGE",
                "PRODUCT",
                -1L,
                reason,
                "count=" + request.getProductIds().size() + ",status=" + request.getStatus());
    }
}
