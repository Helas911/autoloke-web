import { NextRequest, NextResponse } from "next/server";
import {
  deleteFirestoreDocument,
  deleteStorageObject,
  queryExpiredFirestoreDocuments,
  type FirestoreCollectionName,
} from "@/lib/firebaseAdminRest";

export const runtime = "nodejs";

const COLLECTIONS: FirestoreCollectionName[] = ["ads", "parts", "partRequests"];

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const urlSecret = new URL(req.url).searchParams.get("secret");
  return auth === `Bearer ${secret}` || urlSecret === secret;
}

function imagePathsFrom(doc: Record<string, unknown>) {
  const paths = doc.imagePaths;
  if (!Array.isArray(paths)) return [];
  return paths.filter((path): path is string => typeof path === "string" && path.trim().length > 0);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Nėra cron leidimo." }, { status: 401 });
  }

  const now = new Date();
  const result: Record<string, { documents: number; images: number; imageErrors: number }> = {};

  for (const collectionName of COLLECTIONS) {
    result[collectionName] = { documents: 0, images: 0, imageErrors: 0 };

    for (let round = 0; round < 5; round += 1) {
      const expired = await queryExpiredFirestoreDocuments(collectionName, now, 100);
      if (expired.length === 0) break;

      for (const doc of expired) {
        const paths = imagePathsFrom(doc);
        for (const path of paths) {
          try {
            await deleteStorageObject(path);
            result[collectionName].images += 1;
          } catch {
            result[collectionName].imageErrors += 1;
          }
        }

        if (typeof doc.id === "string" && doc.id) {
          await deleteFirestoreDocument(collectionName, doc.id);
          result[collectionName].documents += 1;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, now: now.toISOString(), result });
}
