package com.project.api.repository;

import com.project.api.domain.Product;
import com.project.api.domain.ProductStatus;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public final class ProductSpecs {

    private ProductSpecs() {}

    public static Specification<Product> filtered(ProductStatus statusFilter, Long categoryId, Integer minPrice, Integer maxPrice, String keyword) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.notEqual(root.get("status"), ProductStatus.DELETED));
            if (statusFilter != null) {
                predicates.add(cb.equal(root.get("status"), statusFilter));
            }
            if (categoryId != null) {
                predicates.add(cb.and(cb.isNotNull(root.get("category")), cb.equal(root.get("category").get("id"), categoryId)));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            if (keyword != null && !keyword.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + keyword.trim().toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /** Admin list: optional includeDeleted, status, categoryId, keyword, sellerId. */
    public static Specification<Product> forAdmin(
            Boolean includeDeleted,
            ProductStatus statusFilter,
            Long categoryId,
            String keyword,
            Long sellerId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (Boolean.FALSE.equals(includeDeleted)) {
                predicates.add(cb.notEqual(root.get("status"), ProductStatus.DELETED));
            }
            if (statusFilter != null) {
                predicates.add(cb.equal(root.get("status"), statusFilter));
            }
            if (categoryId != null) {
                predicates.add(cb.and(cb.isNotNull(root.get("category")), cb.equal(root.get("category").get("id"), categoryId)));
            }
            if (keyword != null && !keyword.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + keyword.trim().toLowerCase() + "%"));
            }
            if (sellerId != null) {
                predicates.add(cb.equal(root.get("seller").get("id"), sellerId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
