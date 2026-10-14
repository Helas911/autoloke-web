import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Read-only diagnostic. All probes are bounded so a slow external service
// cannot take down the serverless function or block payment troubleshooting.
type ReadStatuses = {
  publicPartsList: number | null;
  unrestrictedAdsList: number | null;
  privateUsersList: number | null;
  filteredPaidAdsList: number | null;
};
const NO_CACHE = { "Cache-Control": "no-store, max-age=0" };

async function fetchStatus(url: string, body?: unknown): Promise<number | null> {
  try {
    const result = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
    return result.status;
  } catch {
    return null;
  }
}

function classifyAdminError(error: unknown, stage: "import" | "init"): string {
  if (stage === "import") return "module_import_failed";
  if (error instanceof SyntaxError) return "invalid_configuration_json";
  const message = error instanceof Error ? error.message : "";
  if (message === "Firebase server configuration missing") return "configuration_fields_missing";
  if (/private.key|pem.formatt|certificate|invalid.credential/i.test(message)) return "invalid_private_key_or_certificate";
  if (/project.id|project.mismatch/i.test(message)) return "project_configuration_error";
  if (/already.exists|duplicate.app/i.test(message)) return "duplicate_app";
  return "firebase_initialization_failed";
}

async function checkAdminFirestore(): Promise<{ initialized: boolean; readable: boolean; result: string }> {
  // A Firebase SDK read can hang when Google credentials or outbound gRPC are unavailable.
  // Enforce an independent limit rather than waiting for Vercel's function timeout.
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        let adminDb: typeof import("@/lib/firebaseAdmin")["adminDb"];
        try {
          ({ adminDb } = await import("@/lib/firebaseAdmin"));
        } catch (error: unknown) {
          // Restrict public diagnostics to error categories; never disclose env values or stack traces.
          const message = error instanceof Error ? error.message : "";
          const errorCode = error && typeof error === "object" && "code" in error
            ? String((error as {code?: unknown}).code ?? "") : "";
          const result = /MODULE_NOT_FOUND|ERR_MODULE_NOT_FOUND/.test(errorCode)
            || /cannot find module|cannot find package/i.test(message)
              ? "missing_runtime_dependency"
            : /dynamic require|require is not defined|esm/i.test(message)
              ? "module_format_conflict"
            : /server-only|edge runtime/i.test(message)
              ? "runtime_mismatch"
            : "module_evaluation_failed";
          const relatedPackage = /firebase-admin|firestore|google-gax|grpc|google-auth-library/i.test(message)
            ? (/firebase-admin/i.test(message) ? "firebase-admin"
              : /google-gax/i.test(message) ? "google-gax"
              : /grpc/i.test(message) ? "grpc"
              : /google-auth-library/i.test(message) ? "google-auth-library" : "firestore")
            : "unspecified";
          return { initialized: false, readable: false, result: result + ":" + relatedPackage };
        }
        let db: ReturnType<typeof adminDb>;
        try {
          db = adminDb();
        } catch (error) {
          return { initialized: false, readable: false, result: classifyAdminError(error, "init") };
        }
        try {
          const snap = await db.collection("ads").limit(1).get();
          return { initialized: true, readable: typeof snap.empty === "boolean", result: "completed" };
        } catch {
          return { initialized: true, readable: false, result: "read_failed" };
        }
      })().catch((error: unknown) => ({
        initialized: false, readable: false, result: classifyAdminError(error, "init"),
      })),
      new Promise<{ initialized: boolean; readable: boolean; result: string }>((resolve) => {
        timer = setTimeout(() => resolve({ initialized: false, readable: false, result: "timeout" }), 3500);
      }),
    ]);
  } catch {
    return { initialized: false, readable: false, result: "unexpected_error" };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export async function GET() {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const codes: ReadStatuses = {
      publicPartsList: null,
      unrestrictedAdsList: null,
      privateUsersList: null,
      filteredPaidAdsList: null,
    };

    const paidQuery = {
      structuredQuery: {
        from: [{ collectionId: "ads" }],
        where: {
          compositeFilter: {
            op: "AND",
            filters: [
              { fieldFilter: { field: { fieldPath: "paymentStatus" }, op: "EQUAL", value: { stringValue: "paid" } } },
              { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "active" } } },
            ],
          },
        },
        limit: 1,
      },
    };

    const anonymous = (async () => {
      if (!projectId || !apiKey) return;
      const root = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
      const key = `key=${encodeURIComponent(apiKey)}`;
      const result = await Promise.all([
        fetchStatus(`${root}/parts?pageSize=1&${key}`),
        fetchStatus(`${root}/ads?pageSize=1&${key}`),
        fetchStatus(`${root}/users?pageSize=1&${key}`),
        fetchStatus(`${root}:runQuery?${key}`, paidQuery),
      ]);
      [codes.publicPartsList, codes.unrestrictedAdsList, codes.privateUsersList, codes.filteredPaidAdsList] = result;
    })();

    const [admin] = await Promise.all([checkAdminFirestore(), anonymous]);
    const rulesValidated = codes.publicPartsList === 200 &&
      codes.unrestrictedAdsList === 403 &&
      codes.privateUsersList === 403 &&
      codes.filteredPaidAdsList === 200;

    return NextResponse.json({
      adminFirestore: admin.readable,
      adminInitialized: admin.initialized,
      adminProbeResult: admin.result,
      rulesValidated,
      publicReadStatus: codes,
      checkoutEnabled: process.env.STRIPE_CHECKOUT_ENABLED === "true",
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET,
      note: "Read-only diagnostic. Payment processing remains disabled until all checks pass.",
    }, { headers: NO_CACHE });
  } catch {
    return NextResponse.json({
      adminFirestore: false,
      adminInitialized: false,
      rulesValidated: false,
      checkoutEnabled: false,
      diagnosticError: "Readiness diagnostic failed. Do not enable payments.",
    }, { status: 200, headers: NO_CACHE });
  }
}
