package com.project.api.web;

import com.project.api.domain.ProductStatus;
import com.project.api.service.ProductService;
import com.project.api.web.dto.PageResponse;
import com.project.api.web.dto.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

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
    public ProductResponse setStatus(@PathVariable Long id, @RequestParam ProductStatus status) {
        return productService.setStatusByAdmin(id, status);
    }
}
