package com.project.api.service;

import com.project.api.domain.Category;
import com.project.api.domain.OptionGroup;
import com.project.api.domain.OptionValue;
import com.project.api.domain.Product;
import com.project.api.domain.ProductStatus;
import com.project.api.domain.ProductVariant;
import com.project.api.repository.CategoryRepository;
import com.project.api.repository.ProductRepository;
import com.project.api.repository.ProductSpecs;
import com.project.api.web.ForbiddenException;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.OptionGroupInput;
import com.project.api.web.dto.OptionValueInput;
import com.project.api.web.dto.ProductRequest;
import com.project.api.web.dto.ProductResponse;
import com.project.api.web.dto.ProductVariantInput;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Product CRUD. List excludes DELETED. Create requires seller (by id for now).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final MemberService memberService;

    public Page<ProductResponse> getList(Pageable pageable, String keyword, ProductStatus statusFilter, Long categoryId, Integer minPrice, Integer maxPrice) {
        Specification<Product> spec = ProductSpecs.filtered(statusFilter, categoryId, minPrice, maxPrice, keyword);
        return productRepository.findAll(spec, pageable).map(ProductResponse::from);
    }

    public Page<ProductResponse> getBySellerId(Long sellerId, Pageable pageable) {
        Page<Product> page = productRepository.findBySellerId(sellerId, pageable);
        return page.map(ProductResponse::from);
    }

    public Page<ProductResponse> getBySellerId(Long sellerId, ProductStatus status, Pageable pageable) {
        Page<Product> page = productRepository.findBySellerIdAndStatus(sellerId, status, pageable);
        return page.map(ProductResponse::from);
    }

    public ProductResponse getById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
        if (product.getStatus() == ProductStatus.DELETED) {
            throw new NotFoundException("Product not found: " + id);
        }
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse create(Long sellerId, ProductRequest request) {
        var seller = memberService.findById(sellerId);
        Category category = request.getCategoryId() != null ? categoryRepository.findById(request.getCategoryId()).orElse(null) : null;
        var imageUrls = request.getImageUrls();
        String mainUrl = (imageUrls != null && !imageUrls.isEmpty()) ? imageUrls.get(0) : request.getImageUrl();

        var optionGroups = request.getOptionGroups();
        var variants = request.getVariants();
        boolean hasOptions = optionGroups != null && !optionGroups.isEmpty() && variants != null && !variants.isEmpty();
        if (optionGroups != null && !optionGroups.isEmpty() && (variants == null || variants.isEmpty())) {
            throw new IllegalArgumentException("Variants are required when option groups are provided");
        }
        if (variants != null && !variants.isEmpty() && (optionGroups == null || optionGroups.isEmpty())) {
            throw new IllegalArgumentException("Option groups are required when variants are provided");
        }
        if (hasOptions) {
            for (ProductVariantInput vi : variants) {
                if (vi.getOptionValueNames() == null || vi.getOptionValueNames().size() != optionGroups.size()) {
                    throw new IllegalArgumentException("Each variant must have optionValueNames size equal to option groups count");
                }
            }
        }

        int price = request.getPrice() != null ? request.getPrice() : 0;
        int stockQuantity = request.getStockQuantity() != null ? request.getStockQuantity() : 0;
        if (hasOptions) {
            price = variants.stream().map(ProductVariantInput::getPrice).min(Integer::compareTo).orElse(0);
            stockQuantity = variants.stream().mapToInt(ProductVariantInput::getStockQuantity).sum();
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .imageUrl(mainUrl)
                .price(price)
                .stockQuantity(stockQuantity)
                .status(ProductStatus.ON_SALE)
                .seller(seller)
                .category(category)
                .build();
        product = productRepository.save(product);
        if (imageUrls != null && !imageUrls.isEmpty()) {
            product.setProductImages(imageUrls);
            product = productRepository.save(product);
        }

        if (hasOptions) {
            attachOptionGroupsAndVariants(product, optionGroups, variants);
        }
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse update(Long id, Long memberId, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
        if (!product.getSeller().getId().equals(memberId)) {
            throw new ForbiddenException("Not the product owner");
        }
        if (product.getStatus() == ProductStatus.DELETED) {
            throw new NotFoundException("Product is deleted: " + id);
        }
        var optionGroups = request.getOptionGroups();
        var variants = request.getVariants();
        boolean requestHasOptions = optionGroups != null && !optionGroups.isEmpty() && variants != null && !variants.isEmpty();
        if (optionGroups != null && !optionGroups.isEmpty() && (variants == null || variants.isEmpty())) {
            throw new IllegalArgumentException("Variants are required when option groups are provided");
        }
        if (variants != null && !variants.isEmpty() && (optionGroups == null || optionGroups.isEmpty())) {
            throw new IllegalArgumentException("Option groups are required when variants are provided");
        }
        if (requestHasOptions) {
            for (ProductVariantInput vi : variants) {
                if (vi.getOptionValueNames() == null || vi.getOptionValueNames().size() != optionGroups.size()) {
                    throw new IllegalArgumentException("Each variant must have optionValueNames size equal to option groups count");
                }
            }
        }

        int price = request.getPrice() != null ? request.getPrice() : 0;
        int stockQuantity = request.getStockQuantity() != null ? request.getStockQuantity() : 0;
        if (requestHasOptions) {
            price = variants.stream().map(ProductVariantInput::getPrice).min(Integer::compareTo).orElse(0);
            stockQuantity = variants.stream().mapToInt(ProductVariantInput::getStockQuantity).sum();
        }

        Category category = request.getCategoryId() != null ? categoryRepository.findById(request.getCategoryId()).orElse(null) : null;
        var imageUrls = request.getImageUrls();
        String mainUrl = (imageUrls != null && !imageUrls.isEmpty()) ? imageUrls.get(0) : request.getImageUrl();
        product.updateInfo(
                request.getName(),
                request.getDescription(),
                mainUrl,
                price,
                stockQuantity,
                category
        );
        if (imageUrls != null) {
            product.setProductImages(imageUrls);
        }
        if (request.getStatus() != null && request.getStatus() != ProductStatus.DELETED) {
            product.setStatus(request.getStatus());
        }

        // Replace option groups and variants when request defines them
        if (optionGroups != null || variants != null) {
            product.getOptionGroups().clear();
            product.getVariants().clear();
            if (requestHasOptions) {
                attachOptionGroupsAndVariants(product, optionGroups, variants);
            }
        }
        return ProductResponse.from(product);
    }

    /**
     * Attach option groups (with values) and variants to product. Option value names in each variant
     * must match option group order. Call after product is persisted.
     */
    private void attachOptionGroupsAndVariants(Product product, List<OptionGroupInput> optionGroups, List<ProductVariantInput> variants) {
        for (OptionGroupInput gin : optionGroups) {
            OptionGroup g = OptionGroup.builder()
                    .product(product)
                    .name(gin.getName())
                    .sortOrder(gin.getSortOrder())
                    .build();
            product.getOptionGroups().add(g);
            if (gin.getValues() != null) {
                for (OptionValueInput vin : gin.getValues()) {
                    OptionValue ov = OptionValue.builder()
                            .optionGroup(g)
                            .name(vin.getName())
                            .sortOrder(vin.getSortOrder())
                            .build();
                    g.addOptionValue(ov);
                }
            }
        }
        productRepository.save(product);

        List<OptionGroup> groupsOrdered = product.getOptionGroups().stream()
                .sorted(Comparator.comparingInt(OptionGroup::getSortOrder))
                .toList();

        List<ProductVariant> createdVariants = new ArrayList<>();
        for (ProductVariantInput vi : variants) {
            ProductVariant v = ProductVariant.builder()
                    .product(product)
                    .price(vi.getPrice())
                    .stockQuantity(vi.getStockQuantity())
                    .sku(vi.getSku())
                    .build();
            product.getVariants().add(v);
            createdVariants.add(v);
        }
        productRepository.save(product);

        for (int i = 0; i < createdVariants.size(); i++) {
            List<OptionValue> ovals = resolveOptionValues(groupsOrdered, variants.get(i).getOptionValueNames());
            createdVariants.get(i).getOptionValues().addAll(ovals);
        }
        productRepository.save(product);
    }

    private List<OptionValue> resolveOptionValues(List<OptionGroup> groupsOrdered, List<String> names) {
        if (names == null || names.size() != groupsOrdered.size()) {
            throw new IllegalArgumentException("optionValueNames size must match option groups");
        }
        List<OptionValue> result = new ArrayList<>();
        for (int i = 0; i < groupsOrdered.size(); i++) {
            String name = names.get(i);
            OptionGroup g = groupsOrdered.get(i);
            OptionValue ov = g.getOptionValuesOrdered().stream()
                    .filter(ov2 -> name.equals(ov2.getName()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Option value not found: '" + name + "' in group '" + g.getName() + "'"));
            result.add(ov);
        }
        return result;
    }

    @Transactional
    public void delete(Long id, Long memberId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
        if (!product.getSeller().getId().equals(memberId)) {
            throw new ForbiddenException("Not the product owner");
        }
        product.markDeleted();
    }

    /** Admin: list all products with optional filters (includeDeleted, status, categoryId, keyword). */
    public Page<ProductResponse> listForAdmin(Boolean includeDeleted, ProductStatus status, Long categoryId, String keyword, Pageable pageable) {
        Specification<Product> spec = ProductSpecs.forAdmin(includeDeleted, status, categoryId, keyword);
        return productRepository.findAll(spec, pageable).map(ProductResponse::from);
    }

    /** Admin: set product status (e.g. DELETED for hide). */
    @Transactional
    public ProductResponse setStatusByAdmin(Long id, ProductStatus status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
        product.setStatus(status != null ? status : ProductStatus.ON_SALE);
        return ProductResponse.from(product);
    }

    /** Bulk status change for seller's products (ON_SALE / SOLD_OUT only; DELETED excluded). */
    @Transactional
    public void updateStatusBulk(Long sellerId, java.util.List<Long> productIds, ProductStatus status) {
        if (status == ProductStatus.DELETED) {
            throw new IllegalArgumentException("Use delete API for deletion");
        }
        for (Long productId : productIds) {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new NotFoundException("Product not found: " + productId));
            if (!product.getSeller().getId().equals(sellerId)) {
                throw new ForbiddenException("Not the product owner: " + productId);
            }
            if (product.getStatus() != ProductStatus.DELETED) {
                product.setStatus(status);
            }
        }
    }
}
