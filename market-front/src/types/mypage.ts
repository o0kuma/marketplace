export interface MyReviewItem {
  id: number;
  productId: number;
  productName: string;
  rating: number;
  content: string | null;
  createdAt: string;
}

export interface MyQuestionItem {
  id: number;
  productId: number;
  productName: string;
  content: string;
  createdAt: string;
}
