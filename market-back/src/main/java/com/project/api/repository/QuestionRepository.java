package com.project.api.repository;

import com.project.api.domain.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    Page<Question> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    Page<Question> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);

    Page<Question> findByProduct_Seller_IdOrderByCreatedAtDesc(Long sellerId, Pageable pageable);
}
