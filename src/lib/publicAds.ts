import { collection, query, where } from "firebase/firestore";
import { db } from "./firebase";
// Match the security rules: pending listings never reach a public browser.
export function publicAdsQuery() {
  return query(collection(db, "ads"), where("paymentStatus", "==", "paid"), where("status", "==", "active"));
}
