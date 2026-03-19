package com.project.api.web;

import com.project.api.service.ProductService;
import com.project.api.web.dto.PageResponse;
import com.project.api.web.dto.ProductRequest;
import com.project.api.web.dto.ProductResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public PageResponse<ProductResponse> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) com.project.api.domain.ProductStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return PageResponse.of(productService.getList(pageable, keyword, status, categoryId, minPrice, maxPrice));
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable Long id) {
        return productService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ProductRequest request) {
        Long sellerId = Long.parseLong(user.getUsername());
        return productService.create(sellerId, request);
    }

    @PutMapping("/{id}")
    public ProductResponse update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        return productService.update(id, memberId, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        Long memberId = Long.parseLong(user.getUsername());
        productService.delete(id, memberId);
    }
}
