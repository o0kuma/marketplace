package com.project.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Option group for a product (e.g. "용량", "색상"). Contains multiple OptionValues.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "option_groups")
public class OptionGroup extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false)
    private int sortOrder;

    @OneToMany(mappedBy = "optionGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<OptionValue> optionValues = new ArrayList<>();

    @Builder
    public OptionGroup(Product product, String name, int sortOrder) {
        this.product = product;
        this.name = name != null ? name.trim() : "";
        this.sortOrder = sortOrder;
    }

    public void setName(String name) {
        this.name = name != null ? name.trim() : "";
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public void addOptionValue(OptionValue value) {
        optionValues.add(value);
    }

    public List<OptionValue> getOptionValuesOrdered() {
        return optionValues.stream()
                .sorted(Comparator.comparingInt(OptionValue::getSortOrder))
                .toList();
    }
}
