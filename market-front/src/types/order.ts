export type OrderStatus =
  | "ORDERED"
  | "PAYMENT_COMPLETE"
  | "SHIPPING"
  | "COMPLETE"
  | "CANCELLED";

export interface OrderItemResponse {
  productId: number;
  productName: string;
  quantity: number;
  orderPrice: number;
}

export interface Order {
  id: number;
  buyerId: number;
  status: OrderStatus;
  totalAmount: number;
  subtotalAmount?: number;
  shippingFee?: number;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  trackingNumber?: string | null;
  refunded?: boolean;
  items: OrderItemResponse[];
}

export interface OrderListResponse {
  content: Order[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
