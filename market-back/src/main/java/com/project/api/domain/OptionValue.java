package com.project.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Single option value under an OptionGroup (e.g. "10ml", "50ml" under "용량").
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "option_values")
public class OptionValue extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_group_id", nullable = false)
    private OptionGroup optionGroup;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private int sortOrder;

    @Builder
    public OptionValue(OptionGroup optionGroup, String name, int sortOrder) {
        this.optionGroup = optionGroup;
        this.name = name != null ? name.trim() : "";
        this.sortOrder = sortOrder;
    }

    public void setName(String name) {
        this.name = name != null ? name.trim() : "";
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}
