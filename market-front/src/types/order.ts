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
  /** ISO 3166-1 alpha-2; default KR from API when omitted */
  recipientCountry?: string;
  /** false = international lane (Toss not used server-side) */
  domesticShipping?: boolean;
  trackingNumber?: string | null;
  /** From API: non-blank tracking after trim */
  trackingEntered?: boolean;
  /** From API: 결제완료/배송중인데 운송장 미입력 */
  needsTrackingInput?: boolean;
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
