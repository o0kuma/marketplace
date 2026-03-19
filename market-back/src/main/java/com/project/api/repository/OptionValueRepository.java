package com.project.api.repository;

import com.project.api.domain.OptionValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OptionValueRepository extends JpaRepository<OptionValue, Long> {

    List<OptionValue> findByOptionGroupIdOrderBySortOrderAsc(Long optionGroupId);

    Optional<OptionValue> findByOptionGroupIdAndName(Long optionGroupId, String name);
}
