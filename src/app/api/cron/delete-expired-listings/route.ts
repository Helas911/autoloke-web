import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";
import { adminApp, adminDb } from "@/lib/firebaseAdmin";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Destructive maintenance requires an explicit deployment setting after reviewing existing data.
  if (process.env.LISTING_CLEANUP_ENABLED !== "true") return NextResponse.json({ skipped: true });
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) return NextResponse.json({ error: "Storage configuration missing" }, { status: 503 });
  let deleted = 0;
  let errors = 0;
  for (const collection of ["ads", "parts"]) {
    const expired = await adminDb().collection(collection).where("deleteAt", "<=", new Date()).limit(50).get();
    for (const snapshot of expired.docs) {
      try {
        const listing = await adminDb().runTransaction(async (tx) => {
          const fresh = await tx.get(snapshot.ref);
          const data = fresh.data();
          if (!data || !data.deleteAt?.toDate || data.deleteAt.toDate() > new Date()) return null;
          tx.update(snapshot.ref, { status: "deleting" });
          return data;
        });
        if (!listing) continue;
        const bucket = getStorage(adminApp()).bucket(bucketName);
        // Never trust arbitrary imagePaths with server deletion privileges.
        const prefix = `${collection}/${listing.ownerUid}/${snapshot.id}/`;
        await bucket.deleteFiles({ prefix });
        const extraPaths = Array.isArray(listing.imagePaths) ? listing.imagePaths : [];
        for (const path of extraPaths) {
          if (typeof path === "string" && path.startsWith(`${collection}/${listing.ownerUid}/quick/`)) {
            await bucket.file(path).delete({ ignoreNotFound: true });
          }
        }
        await snapshot.ref.delete();
        deleted++;
      } catch {
        // Keep the document (and its photo paths) so tomorrow's run can retry.
        errors++;
      }
    }
  }
  return NextResponse.json({ deleted, errors }, { status: errors ? 500 : 200 });
}
