import { getAdminDb } from "@/lib/firebase-admin";
import { CaseDocument, CaseStatus } from "@/lib/types";

export interface ListCaseFilters {
  userId: string;
  role: "ADMIN" | "JUDGE";
  status?: CaseStatus;
  limit?: number;
}

/**
 * Lists cases for role-aware history.
 */
export async function listCases(filters: ListCaseFilters): Promise<CaseDocument[]> {
  const limit = filters.limit ?? 20;
  const casesCollection = getAdminDb().collection("cases");
  let query = casesCollection.where("deletedAt", "==", null).orderBy("createdAt", "desc");

  if (filters.role !== "ADMIN") {
    query = query.where("judgeId", "==", filters.userId);
  }
  if (filters.status) {
    query = query.where("status", "==", filters.status);
  }

  const snapshot = await query.limit(limit).get();
  return snapshot.docs.map(toCaseDocument);
}

/**
 * Gets a case while enforcing ownership/admin access.
 */
export async function getCaseById(
  caseId: string,
  userId: string,
  role: "ADMIN" | "JUDGE"
): Promise<CaseDocument | null> {
  const casesCollection = getAdminDb().collection("cases");
  const snapshot = await casesCollection.doc(caseId).get();
  if (!snapshot.exists) {
    return null;
  }
  const parsed = toCaseDocument(snapshot);
  if (role !== "ADMIN" && parsed.judgeId !== userId) {
    return null;
  }
  return parsed;
}

/**
 * Creates or updates a case draft/completed record.
 */
export async function upsertCase(input: {
  caseId?: string;
  userId: string;
  role: "ADMIN" | "JUDGE";
  title: string;
  rawOcrText: string;
  fields: Record<string, string>;
  notes: string;
  status: CaseStatus;
}): Promise<string> {
  const now = new Date();
  const casesCollection = getAdminDb().collection("cases");
  const payload = {
    title: input.title,
    status: input.status,
    judgeId: input.userId,
    rawOcrText: input.rawOcrText,
    extractedFields: input.fields,
    notes: input.notes,
    updatedAt: now,
    deletedAt: null
  };

  if (input.caseId) {
    const ref = casesCollection.doc(input.caseId);
    await ref.set(payload, { merge: true });
    return ref.id;
  }

  const ref = await casesCollection.add({
    ...payload,
    createdAt: now
  });
  return ref.id;
}

/**
 * Soft deletes a case record.
 */
export async function softDeleteCase(caseId: string): Promise<void> {
  await getAdminDb()
    .collection("cases")
    .doc(caseId)
    .set(
      {
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      { merge: true }
    );
}

function toCaseDocument(snapshot: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): CaseDocument {
  const data = snapshot.data();
  if (!data) {
    throw new Error("Invalid case document");
  }

  return {
    id: snapshot.id,
    title: String(data.title ?? ""),
    status: data.status as CaseStatus,
    judgeId: String(data.judgeId ?? ""),
    rawOcrText: String(data.rawOcrText ?? ""),
    extractedFields: (data.extractedFields ?? {}) as Record<string, string>,
    notes: String(data.notes ?? ""),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    deletedAt: data.deletedAt?.toDate?.() ?? null
  };
}
