import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function adminApp() {
  const existing = getApps().find((app) => app.name === "autoloke-server");
  if (existing) return existing;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const service = raw ? JSON.parse(raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8")) : {};
  const projectId = service.project_id || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = service.client_email || process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (service.private_key || process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("Firebase server configuration missing");
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }, "autoloke-server");
}
export const adminDb = () => getFirestore(adminApp());
export type TokenVerificationFailure =
  | "missing_token"
  | "auth_sdk_unavailable"
  | "server_configuration_error"
  | "expired_token"
  | "revoked_token"
  | "invalid_token"
  | "token_verification_unavailable";

export type TokenVerificationResult = { uid: string; failure?: never } | { uid: null; failure: TokenVerificationFailure };

export async function authenticatedUser(request: Request): Promise<TokenVerificationResult> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ") || header.length < 15) return { uid: null, failure: "missing_token" };
  let getAuth: typeof import("firebase-admin/auth")["getAuth"];
  try {
    // Dynamically import only when verifying a login; Firestore must not depend on Auth loading.
    ({ getAuth } = await import("firebase-admin/auth"));
  } catch {
    // Some Vercel runtime bundles cannot load firebase-admin/auth even while
    // firebase-admin/firestore is healthy. Verify the token against Google's
    // published rotating signing certificates instead of trusting client UID.
    try {
      const { verifyFirebaseIdTokenWithGoogleCerts } = await import("./firebaseTokenVerifier");
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (!projectId) return { uid: null, failure: "server_configuration_error" };
      const verified = await verifyFirebaseIdTokenWithGoogleCerts(header.slice(7), projectId);
      if (verified.uid) return { uid: verified.uid };
      return { uid: null, failure: verified.reason };
    } catch {
      return { uid: null, failure: "auth_sdk_unavailable" };
    }
  }
  let app;
  try {
    app = adminApp();
  } catch {
    return { uid: null, failure: "server_configuration_error" };
  }
  try {
    // Checking revocation additionally queries Firebase Auth; report failures separately from expired tokens.
    const decoded = await getAuth(app).verifyIdToken(header.slice(7), true);
    return { uid: decoded.uid };
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? String(error.code) : "";
    if (code === "auth/id-token-expired") return { uid: null, failure: "expired_token" };
    if (code === "auth/id-token-revoked") return { uid: null, failure: "revoked_token" };
    if (code === "auth/invalid-id-token" || code === "auth/argument-error"
      || code === "auth/invalid-argument" || code === "auth/project-id-mismatch") {
      return { uid: null, failure: "invalid_token" };
    }
    return { uid: null, failure: "token_verification_unavailable" };
  }
}

// Retain the original helper for any other callers.
export async function authenticatedUid(request: Request) {
  return (await authenticatedUser(request)).uid;
}
