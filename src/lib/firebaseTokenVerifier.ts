import { createPublicKey, verify as verifySignature } from "node:crypto";

// Google publishes the rotating public certificates used to sign Firebase ID tokens.
// No service-account private key or user token is exposed to the browser.
const CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const MAX_TOKEN_LENGTH = 16_384;
let certCache: { expiresAt: number; certificates: Record<string, string> } | null = null;
let certRequest: Promise<Record<string, string>> | null = null;

export type VerifiedFirebaseToken =
  | { uid: string }
  | { uid: null; reason: "expired_token" | "invalid_token" | "token_verification_unavailable" };

type TokenHeader = { alg?: unknown; kid?: unknown; typ?: unknown };
type TokenClaims = {
  iss?: unknown; aud?: unknown; sub?: unknown; exp?: unknown;
  iat?: unknown; auth_time?: unknown;
};

function parsePart<T>(value: string): T | null {
  try {
    const bytes = Buffer.from(value, "base64url");
    if (bytes.length > 8192) return null;
    return JSON.parse(bytes.toString("utf8")) as T;
  } catch {
    return null;
  }
}

async function loadGoogleCerts(forceRefresh = false): Promise<Record<string, string>> {
  if (!forceRefresh && certCache && certCache.expiresAt > Date.now()) return certCache.certificates;
  if (certRequest) return certRequest;
  certRequest = (async () => {
    const response = await fetch(CERT_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(5500),
    });
    if (!response.ok) throw new Error("Firebase certificate download unavailable");
    const incoming: unknown = await response.json();
    if (typeof incoming !== "object" || !incoming || Array.isArray(incoming)) {
      throw new Error("Invalid Firebase certificate response");
    }
    const certs: Record<string, string> = {};
    for (const [kid, pem] of Object.entries(incoming)) {
      if (typeof pem === "string" && pem.includes("-----BEGIN CERTIFICATE-----")) certs[kid] = pem;
    }
    if (Object.keys(certs).length === 0) throw new Error("No valid Firebase certificates");
    const match = response.headers.get("cache-control")?.match(/(?:^|,)\s*max-age=(\d+)/);
    const maxAgeSeconds = match ? Number(match[1]) : 300;
    const ttl = Math.max(60, Math.min(3600, Number.isFinite(maxAgeSeconds) ? maxAgeSeconds : 300));
    certCache = { certificates: certs, expiresAt: Date.now() + ttl * 1000 };
    return certs;
  })();
  try {
    return await certRequest;
  } finally {
    certRequest = null;
  }
}

export function verifyTokenSignatureAndClaims(
  token: string, pem: string, expectedProjectId: string, nowSeconds = Math.floor(Date.now() / 1000),
): VerifiedFirebaseToken {
  if (token.length > MAX_TOKEN_LENGTH) return { uid: null, reason: "invalid_token" };
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((p) => !/^[A-Za-z0-9_-]+$/.test(p))) {
    return { uid: null, reason: "invalid_token" };
  }
  const [headerPart, claimsPart, signaturePart] = parts;
  const header = parsePart<TokenHeader>(headerPart);
  const claims = parsePart<TokenClaims>(claimsPart);
  if (!header || !claims || header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) {
    return { uid: null, reason: "invalid_token" };
  }
  if (typeof claims.exp !== "number" || !Number.isInteger(claims.exp) || claims.exp <= nowSeconds) {
    return { uid: null, reason: "expired_token" };
  }
  if (claims.aud !== expectedProjectId || claims.iss !== `https://securetoken.google.com/${expectedProjectId}`
      || typeof claims.sub !== "string" || claims.sub.length < 1 || claims.sub.length > 128
      || typeof claims.iat !== "number" || !Number.isInteger(claims.iat) || claims.iat > nowSeconds
      || typeof claims.auth_time !== "number" || !Number.isInteger(claims.auth_time) || claims.auth_time > nowSeconds
      || claims.auth_time > claims.iat) {
    return { uid: null, reason: "invalid_token" };
  }
  try {
    const signatureValid = verifySignature(
      "RSA-SHA256",
      Buffer.from(`${headerPart}.${claimsPart}`, "ascii"),
      createPublicKey(pem),
      Buffer.from(signaturePart, "base64url"),
    );
    return signatureValid ? { uid: claims.sub } : { uid: null, reason: "invalid_token" };
  } catch {
    return { uid: null, reason: "invalid_token" };
  }
}

/**
 * Fallback for Vercel builds in which firebase-admin/auth cannot load.
 * Uses Google's official rotating Firebase ID token signing certificates.
 * Does not check revocation; only use when the Admin Auth module is unavailable.
 * Tokens are short lived (normally 1 hour), signed, audience/issuer bound.
 */
export async function verifyFirebaseIdTokenWithGoogleCerts(
  idToken: string, expectedProjectId: string,
): Promise<VerifiedFirebaseToken> {
  if (idToken.length > MAX_TOKEN_LENGTH) return { uid: null, reason: "invalid_token" };
  const header = parsePart<TokenHeader>(idToken.split(".")[0] || "");
  if (!header || header.alg !== "RS256" || typeof header.kid !== "string"
    || header.kid.length > 200) return { uid: null, reason: "invalid_token" };
  try {
    let certs = await loadGoogleCerts();
    if (!certs[header.kid]) certs = await loadGoogleCerts(true);
    const pem = certs[header.kid];
    if (!pem) return { uid: null, reason: "invalid_token" };
    return verifyTokenSignatureAndClaims(idToken, pem, expectedProjectId);
  } catch {
    return { uid: null, reason: "token_verification_unavailable" };
  }
}
