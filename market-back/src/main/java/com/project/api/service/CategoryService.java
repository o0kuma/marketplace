package com.project.api.service;

import com.project.api.domain.Category;
import com.project.api.repository.CategoryRepository;
import com.project.api.repository.ProductRepository;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.AdminCategoryListItemResponse;
import com.project.api.web.dto.CategoryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public List<CategoryResponse> list() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(CategoryResponse::from)
                .collect(Collectors.toList());
    }

    public List<AdminCategoryListItemResponse> listForAdmin(String keyword, Boolean hasProducts) {
        String kw = keyword == null ? "" : keyword.trim().toLowerCase();
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(c -> AdminCategoryListItemResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .productCount(productRepository.countByCategory_Id(c.getId()))
                        .build())
                .filter(c -> kw.isEmpty() || c.getName().toLowerCase().contains(kw))
                .filter(c -> hasProducts == null || (hasProducts ? c.getProductCount() > 0 : c.getProductCount() == 0))
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse create(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Category name is required");
        }
        Category category = Category.builder().name(name.trim()).build();
        category = categoryRepository.save(category);
        return CategoryResponse.from(category);
    }

    @Transactional
    public CategoryResponse update(Long id, String name) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found: " + id));
        if (name != null && !name.isBlank()) {
            category.setName(name.trim());
        }
        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found: " + id));
        productRepository.findByCategory_Id(id).forEach(p -> p.setCategory(null));
        categoryRepository.delete(category);
    }
}
