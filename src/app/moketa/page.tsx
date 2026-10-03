"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { isPublicPaidListing } from "@/lib/billing";
import { getSiteCountry } from "@/lib/site";

export default function MoketaPage() {
  const isDk = getSiteCountry() === "DK";
  const { user } = useAuth();
  const [paid, setPaid] = useState(false);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("listingId");
    if (!id || !user || !db) return;
    return onSnapshot(doc(db, "ads", id), (snap) => {
      setPaid(snap.exists() && snap.data().ownerUid === user.uid && isPublicPaidListing(snap.data()));
    }, () => setPaid(false));
  }, [user]);
  return <main className="mx-auto max-w-xl px-4 py-12 text-white">
    <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-6">
      <h1 className="text-2xl font-black">{paid ? (isDk ? "Betaling bekræftet" : "Mokėjimas patvirtintas") : (isDk ? "Afventer betalingsbekræftelse" : "Laukiama mokėjimo patvirtinimo")}</h1>
      <p className="mt-3 leading-6 text-white/75">{paid ? (isDk ? "Din annonce er aktiv i 30 dage fra betalingen." : "Jūsų skelbimas aktyvus 30 dienų nuo apmokėjimo.") : (isDk ? "Se betalingsstatus under Mine annoncer. Du behøver ikke betale igen, mens betalingen behandles." : "Būseną matysite skiltyje „Mano skelbimai“. Kol mokėjimas tikrinamas, pakartotinai mokėti nereikia.")}</p>
      <Link href="/mano" className="mt-6 inline-block rounded-2xl bg-white px-4 py-3 font-black text-black">{isDk ? "Mine annoncer" : "Mano skelbimai"}</Link>
    </div>
  </main>;
}
