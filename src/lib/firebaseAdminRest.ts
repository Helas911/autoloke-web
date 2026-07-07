import { createSign } from "crypto";

export type FirestoreCollectionName = "ads" | "parts" | "partRequests";

type ServiceAccount = {
  project_id?: string;
  client_email: string;
  private_key: string;
};

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

let tokenCache: { token: string; expiresAt: number } | null = null;

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function parseServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (raw) {
    const decoded = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<ServiceAccount>;
    if (parsed.client_email && parsed.private_key) {
      return {
        project_id: parsed.project_id,
        client_email: parsed.client_email,
        private_key: parsed.private_key.replace(/\\n/g, "\n"),
      };
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!clientEmail || !privateKey) {
    throw new Error("Trūksta Firebase serverio raktų. Į Vercel env įdėk FIREBASE_SERVICE_ACCOUNT_KEY arba FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.");
  }

  return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
}

export function getFirebaseProjectId() {
  const serviceAccount = parseServiceAccount();
  const projectId = serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Trūksta Firebase projectId serverio aplinkoje.");
  return projectId;
}

async function getAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;

  const serviceAccount = parseServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/devstorage.full_control",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(serviceAccount.private_key).toString("base64url");
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const json = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || "Nepavyko gauti Firebase serverio prieigos rakto.");
  }

  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in || 3600) * 1000,
  };

  return tokenCache.token;
}

async function authedFetch(url: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(url, { ...init, headers });
}

function firestoreBaseUrl() {
  return `https://firestore.googleapis.com/v1/projects/${getFirebaseProjectId()}/databases/(default)/documents`;
}

function documentUrl(collectionName: FirestoreCollectionName, id: string) {
  return `${firestoreBaseUrl()}/${encodeURIComponent(collectionName)}/${encodeURIComponent(id)}`;
}

function encodeValue(value: unknown): FirestoreValue {
  if (value === null) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((v) => encodeValue(v)) } };
  }
  if (typeof value === "object" && value) {
    const fields: Record<string, FirestoreValue> = {};
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      if (v !== undefined) fields[k] = encodeValue(v);
    });
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

function decodeValue(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue || "";
  if ("integerValue" in value) return Number(value.integerValue || 0);
  if ("doubleValue" in value) return Number(value.doubleValue || 0);
  if ("booleanValue" in value) return !!value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue || null;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue?.values || []).map((v) => decodeValue(v));
  if ("mapValue" in value) {
    const obj: Record<string, unknown> = {};
    Object.entries(value.mapValue?.fields || {}).forEach(([k, v]) => {
      obj[k] = decodeValue(v);
    });
    return obj;
  }
  return null;
}

function decodeDocument(doc: FirestoreDocument) {
  const fields: Record<string, unknown> = {};
  Object.entries(doc.fields || {}).forEach(([key, value]) => {
    fields[key] = decodeValue(value);
  });
  return {
    id: doc.name.split("/").pop() || "",
    name: doc.name,
    ...fields,
  };
}

export async function getFirestoreDocument(collectionName: FirestoreCollectionName, id: string) {
  const res = await authedFetch(documentUrl(collectionName, id));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Nepavyko rasti dokumento: ${await res.text()}`);
  return decodeDocument((await res.json()) as FirestoreDocument);
}

export async function patchFirestoreDocument(
  collectionName: FirestoreCollectionName,
  id: string,
  data: Record<string, unknown>
) {
  const fields: Record<string, FirestoreValue> = {};
  const updateMask = new URLSearchParams();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    fields[key] = encodeValue(value);
    updateMask.append("updateMask.fieldPaths", key);
  });

  const res = await authedFetch(`${documentUrl(collectionName, id)}?${updateMask.toString()}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) throw new Error(`Nepavyko atnaujinti dokumento: ${await res.text()}`);
  return decodeDocument((await res.json()) as FirestoreDocument);
}

export async function deleteFirestoreDocument(collectionName: FirestoreCollectionName, id: string) {
  const res = await authedFetch(documentUrl(collectionName, id), { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`Nepavyko ištrinti dokumento: ${await res.text()}`);
}

export async function queryExpiredFirestoreDocuments(
  collectionName: FirestoreCollectionName,
  before: Date,
  limit = 100
) {
  const res = await authedFetch(`${firestoreBaseUrl()}:runQuery`, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collectionName }],
        where: {
          fieldFilter: {
            field: { fieldPath: "deleteAt" },
            op: "LESS_THAN_OR_EQUAL",
            value: { timestampValue: before.toISOString() },
          },
        },
        limit,
      },
    }),
  });

  if (!res.ok) throw new Error(`Nepavyko gauti pasibaigusių skelbimų: ${await res.text()}`);
  const rows = (await res.json()) as Array<{ document?: FirestoreDocument }>;
  return rows.filter((r) => r.document).map((r) => decodeDocument(r.document as FirestoreDocument));
}

export async function deleteStorageObject(path: string) {
  const bucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) throw new Error("Trūksta FIREBASE_STORAGE_BUCKET arba NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.");

  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(path)}`;
  const res = await authedFetch(url, { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`Nepavyko ištrinti nuotraukos ${path}: ${await res.text()}`);
}
