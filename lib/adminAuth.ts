// 后台会话签名（Web Crypto，edge 中间件与 node 路由通用）
export const ADMIN_COOKIE = "admin_session";
const MAX_AGE_SEC = 7 * 24 * 3600; // 7 天

function getSecret(): string {
  return process.env.ADMIN_SECRET || "dev-insecure-secret-change-me";
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64url(new Uint8Array(sig));
}

// 生成会话令牌：`${过期时间ms}.${签名}`
export async function createSessionToken(): Promise<string> {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const sig = await hmac(String(exp));
  return `${exp}.${sig}`;
}

// 校验会话令牌
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await hmac(expStr);
  // 等长比较
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

export const ADMIN_COOKIE_MAX_AGE = MAX_AGE_SEC;
