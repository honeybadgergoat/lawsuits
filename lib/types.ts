export type UserRole = "ADMIN" | "JUDGE";
export type CaseStatus = "DRAFT" | "COMPLETED";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  dailyLimit: number;
  createdAt: Date;
}

export interface CaseDocument {
  id: string;
  title: string;
  status: CaseStatus;
  judgeId: string;
  rawOcrText: string;
  extractedFields: Record<string, string>;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
  };
}

export interface UsageSummary {
  today: number;
  dailyLimit: number;
}
