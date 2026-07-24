import crypto from "crypto";

function encryptionKey(): Buffer {
  const secret = process.env.THREADS_TOKEN_ENCRYPTION_KEY || process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("Segredo de criptografia Threads ausente ou curto");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptThreadsToken(token: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptThreadsToken(value: string): string {
  if (!value.startsWith("v1.")) return value;
  const [, ivRaw, tagRaw, encryptedRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new Error("Token Threads invalido");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64url")), decipher.final()]).toString("utf8");
}
