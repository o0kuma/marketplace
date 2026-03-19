package com.project.api.service;

import com.project.api.domain.Cart;
import com.project.api.domain.CartItem;
import com.project.api.domain.Member;
import com.project.api.domain.Product;
import com.project.api.domain.ProductVariant;
import com.project.api.repository.CartItemRepository;
import com.project.api.repository.CartRepository;
import com.project.api.repository.ProductRepository;
import com.project.api.repository.ProductVariantRepository;
import com.project.api.web.ForbiddenException;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.CartItemRequest;
import com.project.api.domain.ProductStatus;
import com.project.api.web.dto.CartCheckoutPreviewRequest;
import com.project.api.web.dto.CartResponse;
import com.project.api.web.dto.CartItemResponse;
import com.project.api.web.dto.CheckoutPreviewLineResponse;
import com.project.api.web.dto.CheckoutPreviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final MemberService memberService;
    private final ShippingQuoteService shippingQuoteService;

    public CartResponse getCart(Long memberId) {
        Cart cart = getOrCreateCart(memberId);
        return CartResponse.from(cart);
    }

    @Transactional
    public CartResponse addItem(Long memberId, CartItemRequest request) {
        Member member = memberService.findById(memberId);
        Cart cart = cartRepository.findByMemberId(memberId)
                .orElseGet(() -> cartRepository.save(Cart.builder().member(member).build()));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new NotFoundException("Product not found: " + request.getProductId()));

        ProductVariant variant = null;
        if (request.getProductVariantId() != null) {
            variant = productVariantRepository.findById(request.getProductVariantId())
                    .orElseThrow(() -> new NotFoundException("Variant not found: " + request.getProductVariantId()));
            if (!variant.getProduct().getId().equals(product.getId())) {
                throw new IllegalArgumentException("Variant does not belong to product");
            }
            if (variant.isSoldOut()) {
                throw new IllegalArgumentException("Sold out: " + variant.getOptionSummary());
            }
            if (variant.getStockQuantity() < request.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for " + variant.getOptionSummary());
            }
        } else if (product.hasVariants()) {
            throw new IllegalArgumentException("Product has options; select a variant");
        } else {
            if (product.getStatus() == ProductStatus.SOLD_OUT) {
                throw new IllegalArgumentException("Product sold out");
            }
            if (product.getStockQuantity() < request.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock");
            }
        }

        List<CartItem> items = cart.getItems();
        Long variantId = variant != null ? variant.getId() : null;
        CartItem existing = items.stream()
                .filter(i -> i.getProduct().getId().equals(request.getProductId())
                        && (i.getProductVariant() == null ? variantId == null : (variantId != null && i.getProductVariant().getId().equals(variantId))))
                .findFirst()
                .orElse(null);
        if (existing != null) {
            int newQty = existing.getQuantity() + request.getQuantity();
            int maxStock = variant != null ? variant.getStockQuantity() : product.getStockQuantity();
            if (newQty > maxStock) {
                throw new IllegalArgumentException("Insufficient stock (max " + maxStock + ")");
            }
            existing.setQuantity(newQty);
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .productVariant(variant)
                    .quantity(request.getQuantity())
                    .build();
            cart.addItem(item);
            cartItemRepository.save(item);
        }
        return CartResponse.from(cartRepository.findById(cart.getId()).orElseThrow());
    }

    @Transactional
    public CartResponse updateItemQuantity(Long memberId, Long cartItemId, int quantity) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new NotFoundException("Cart item not found: " + cartItemId));
        if (!item.getCart().getMember().getId().equals(memberId)) {
            throw new ForbiddenException("Not your cart item");
        }
        if (quantity < 1) {
            item.getCart().removeItem(item);
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
        }
        Cart cart = item.getCart();
        return CartResponse.from(cartRepository.findById(cart.getId()).orElseThrow());
    }

    @Transactional
    public void removeItem(Long memberId, Long cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new NotFoundException("Cart item not found: " + cartItemId));
        if (!item.getCart().getMember().getId().equals(memberId)) {
            throw new ForbiddenException("Not your cart item");
        }
        item.getCart().removeItem(item);
        cartItemRepository.delete(item);
    }

    public int getCartItemCount(Long memberId) {
        return cartRepository.findByMemberId(memberId)
                .map(c -> c.getItems().size())
                .orElse(0);
    }

    private Cart getOrCreateCart(Long memberId) {
        Member member = memberService.findById(memberId);
        return cartRepository.findByMemberId(memberId)
                .orElseGet(() -> cartRepository.save(Cart.builder().member(member).build()));
    }

    public CheckoutPreviewResponse previewCheckout(Long memberId, CartCheckoutPreviewRequest request) {
        Cart cart = cartRepository.findByMemberId(memberId).orElse(null);
        if (cart == null || cart.getItems().isEmpty()) {
            return CheckoutPreviewResponse.builder()
                    .lines(List.of())
                    .subtotalKrw(0)
                    .shippingFeeKrw(0)
                    .totalKrw(0)
                    .freeShippingThresholdKrw(shippingQuoteService.quote(0).getFreeShippingThresholdKrw())
                    .build();
        }
        List<Long> wanted = request.getCartItemIds() != null ? request.getCartItemIds() : List.of();
        List<CartItem> lines = wanted.isEmpty()
                ? List.copyOf(cart.getItems())
                : cart.getItems().stream()
                        .filter(i -> wanted.contains(i.getId()))
                        .toList();
        if (lines.isEmpty()) {
            throw new IllegalArgumentException("No matching cart lines for checkout");
        }
        var previewLines = new java.util.ArrayList<CheckoutPreviewLineResponse>();
        int subtotal = 0;
        for (CartItem ci : lines) {
            Product p = ci.getProduct();
            if (p.getStatus() == ProductStatus.DELETED) {
                throw new IllegalArgumentException("Product no longer available: " + p.getName());
            }
            if (ci.getProductVariant() != null) {
                if (ci.getProductVariant().isSoldOut()) {
                    throw new IllegalArgumentException("Sold out: " + p.getName() + " (" + ci.getProductVariant().getOptionSummary() + ")");
                }
                if (ci.getProductVariant().getStockQuantity() < ci.getQuantity()) {
                    throw new IllegalArgumentException("Insufficient stock: " + p.getName() + " (" + ci.getProductVariant().getOptionSummary() + ")");
                }
            } else if (p.getStatus() == ProductStatus.SOLD_OUT || p.getStockQuantity() < ci.getQuantity()) {
                throw new IllegalArgumentException("Sold out or insufficient stock: " + p.getName());
            }
            int unitPrice = ci.getUnitPrice();
            int line = unitPrice * ci.getQuantity();
            subtotal += line;
            previewLines.add(CheckoutPreviewLineResponse.builder()
                    .cartItemId(ci.getId())
                    .productId(p.getId())
                    .productVariantId(ci.getProductVariant() != null ? ci.getProductVariant().getId() : null)
                    .productName(p.getName())
                    .optionSummary(ci.getProductVariant() != null ? ci.getProductVariant().getOptionSummary() : null)
                    .price(unitPrice)
                    .quantity(ci.getQuantity())
                    .lineTotal(line)
                    .build());
        }
        var q = shippingQuoteService.quote(subtotal);
        return CheckoutPreviewResponse.builder()
                .lines(previewLines)
                .subtotalKrw(subtotal)
                .shippingFeeKrw(q.getShippingFeeKrw())
                .totalKrw(q.getTotalKrw())
                .freeShippingThresholdKrw(q.getFreeShippingThresholdKrw())
                .build();
    }
}
