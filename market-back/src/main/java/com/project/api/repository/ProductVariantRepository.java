package com.project.api.repository;

import com.project.api.domain.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    /**
     * Ensures {@code product_variant_option_values} has a row even when Hibernate skips ManyToMany sync.
     * Idempotent: skips if the pair already exists (PostgreSQL + H2 compatible via NOT EXISTS).
     */
    @Modifying(flushAutomatically = true)
    @Query(
            value =
                    """
                    INSERT INTO product_variant_option_values (variant_id, option_value_id)
                    SELECT :variantId, :optionValueId
                    WHERE NOT EXISTS (
                        SELECT 1 FROM product_variant_option_values j
                        WHERE j.variant_id = :variantId AND j.option_value_id = :optionValueId)
                    """,
            nativeQuery = true)
    int insertJoinLinkIfMissing(@Param("variantId") Long variantId, @Param("optionValueId") Long optionValueId);

    /**
     * Reads join table directly so API can return {@code optionValueIds} even when the JPA
     * {@code optionValues} bag failed to load or was never hydrated.
     */
    @Query(
            value =
                    """
                    SELECT ov.id FROM product_variant_option_values vv
                    INNER JOIN option_values ov ON ov.id = vv.option_value_id
                    INNER JOIN option_groups og ON og.id = ov.option_group_id
                    WHERE vv.variant_id = :variantId
                    ORDER BY og.sort_order ASC, ov.sort_order ASC
                    """,
            nativeQuery = true)
    List<Long> findOptionValueIdsByVariantIdOrdered(@Param("variantId") Long variantId);
}
