package com.project.api.repository;

import com.project.api.domain.Product;
import com.project.api.domain.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Page<Product> findByStatusNot(ProductStatus excluded, Pageable pageable);

    Page<Product> findBySellerId(Long sellerId, Pageable pageable);

    Page<Product> findBySellerIdAndStatus(Long sellerId, ProductStatus status, Pageable pageable);

    long countBySellerId(Long sellerId);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    Page<Product> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Product> findByStatusNotAndNameContainingIgnoreCase(
            ProductStatus excluded, String name, Pageable pageable);

    java.util.List<Product> findByCategory_Id(Long categoryId);
}
