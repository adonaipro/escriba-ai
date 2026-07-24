import crypto from "crypto";

interface ThreadsSignedRequest {
  user_id?: string | number;
  issued_at?: number;
  algorithm?: string;
}

export function verifyThreadsSignedRequest(value: string): ThreadsSignedRequest {
  const secret = process.env.THREADS_APP_SECRET;
  if (!secret) throw new Error("THREADS_APP_SECRET nao configurada");
  const [signaturePart, payloadPart] = value.split(".");
  if (!signaturePart || !payloadPart) throw new Error("signed_request invalido");

  const provided = Buffer.from(signaturePart, "base64url");
  const expected = crypto.createHmac("sha256", secret).update(payloadPart).digest();
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    throw new Error("Assinatura Meta invalida");
  }

  const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as ThreadsSignedRequest;
  if (payload.algorithm && payload.algorithm.toUpperCase() !== "HMAC-SHA256") throw new Error("Algoritmo Meta invalido");
  return payload;
}
