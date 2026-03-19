export type MemberRole = "USER" | "SELLER" | "ADMIN";

export interface Member {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: MemberRole;
  /** When backend exposes avatar URL, header shows photo instead of initials */
  profileImageUrl?: string | null;
}

export interface LoginResponse {
  token: string;
  member: Member;
}
