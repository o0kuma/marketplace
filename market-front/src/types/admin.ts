export interface AdminActionLog {
  id: number;
  adminId: number;
  actionType: string;
  targetType: string;
  targetId: number;
  reason?: string | null;
  details?: string | null;
  createdAt: string;
}
