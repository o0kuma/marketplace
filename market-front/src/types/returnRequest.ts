export type ReturnRequestType = "RETURN" | "EXCHANGE";
export type ReturnRequestStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface ReturnRequest {
  id: number;
  orderId: number;
  type: ReturnRequestType;
  status: ReturnRequestStatus;
  reason: string;
  sellerComment: string | null;
  createdAt: string;
}
