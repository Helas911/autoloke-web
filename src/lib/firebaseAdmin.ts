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
export async function authenticatedUid(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    // Keep Auth dependencies out of the Firestore-only module initialization path.
    const { getAuth } = await import("firebase-admin/auth");
    return (await getAuth(adminApp()).verifyIdToken(header.slice(7), true)).uid;
  } catch { return null; }
}
