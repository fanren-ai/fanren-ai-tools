import { promises as fs } from "node:fs";
import path from "node:path";

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), "utf8");
}

// ---- 提交审核 ----
export interface Submission {
  id: string;
  name: string;
  url: string;
  category?: string;
  categories?: string[];
  description?: string;
  contact?: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  reviewComment?: string;
  reviewedAt?: string;
}
export interface SubmissionDB {
  submissions: Submission[];
  updatedAt: string;
}

// ---- 状态反馈 ----
export interface FeedbackItem {
  type: string;
  text: string;
  time: string;
}
export interface FeedbackDB {
  feedbacks: Record<string, FeedbackItem[]>;
  updatedAt: string;
}
