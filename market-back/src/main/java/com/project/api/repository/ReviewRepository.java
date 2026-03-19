package com.project.api.repository;

import com.project.api.domain.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    Page<Review> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);

    Page<Review> findByProduct_Seller_IdOrderByCreatedAtDesc(Long sellerId, Pageable pageable);

    boolean existsByOrderItemId(Long orderItemId);
}

