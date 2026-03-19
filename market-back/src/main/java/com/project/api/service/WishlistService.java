package com.project.api.service;

import com.project.api.domain.Member;
import com.project.api.domain.Product;
import com.project.api.domain.Wishlist;
import com.project.api.repository.ProductRepository;
import com.project.api.repository.WishlistRepository;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.PageResponse;
import com.project.api.web.dto.WishlistItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Wishlist (favorites) add/remove and list for authenticated member.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final MemberService memberService;
    private final ProductRepository productRepository;

    /** Add product to wishlist. Idempotent: no-op if already in wishlist. */
    @Transactional
    public void add(Long memberId, Long productId) {
        if (wishlistRepository.existsByMemberIdAndProductId(memberId, productId)) {
            return;
        }
        Member member = memberService.findById(memberId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + productId));
        wishlistRepository.save(Wishlist.builder().member(member).product(product).build());
    }

    /** Remove product from wishlist. Idempotent: no-op if not in wishlist. */
    @Transactional
    public void remove(Long memberId, Long productId) {
        wishlistRepository.deleteByMemberIdAndProductId(memberId, productId);
    }

    public PageResponse<WishlistItemResponse> getMyWishlist(Long memberId, Pageable pageable) {
        Page<Wishlist> page = wishlistRepository.findByMemberIdOrderByCreatedAtDesc(memberId, pageable);
        return PageResponse.of(page.map(WishlistItemResponse::from));
    }

    public boolean isInWishlist(Long memberId, Long productId) {
        return wishlistRepository.existsByMemberIdAndProductId(memberId, productId);
    }
}
