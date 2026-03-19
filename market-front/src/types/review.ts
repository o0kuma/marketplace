export interface Review {
  id: number;
  productId: number;
  authorId: number;
  authorName: string;
  rating: number;
  content: string | null;
  createdAt: string;
}

export interface ReviewableOrderItem {
  orderItemId: number;
  orderId: number;
  productName: string;
  quantity: number;
  orderCompletedAt: string;
}
