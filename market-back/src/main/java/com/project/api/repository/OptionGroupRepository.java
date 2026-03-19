package com.project.api.repository;

import com.project.api.domain.OptionGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OptionGroupRepository extends JpaRepository<OptionGroup, Long> {

    List<OptionGroup> findByProductIdOrderBySortOrderAsc(Long productId);
}
