export interface WishlistItem {
  wishlistId: number;
  productId: number;
  productName: string;
  imageUrl: string | null;
  price: number;
  addedAt: string;
}
