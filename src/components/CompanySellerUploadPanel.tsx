"use client";

import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { slugifySeller } from "@/lib/sellers";

type Listing = { id: string; ownerUid?: string; sellerName?: string; createdAt?: any };
type SellerProfile = { enabled: boolean; sellerName: string; sellerWebsite: string; sellerWorkingHours: string; sellerLogoUrl: string; sellerCoverUrl: string };
type SellerPayload = {
  sellerType: "company";
  sellerId: string;
  sellerName: string;
  sellerWebsite?: string;
  sellerWorkingHours?: string;
  sellerLogoUrl?: string;
  sellerCoverUrl?: string;
};

const STORAGE_KEY = "autoloke_company_seller_profile";
const emptyProfile: SellerProfile = { enabled: false, sellerName: "", sellerWebsite: "", sellerWorkingHours: "", sellerLogoUrl: "", sellerCoverUrl: "" };

function createdRecently(createdAt: any) {
  const millis = typeof createdAt?.toMillis === "function" ? createdAt.toMillis() : 0;
  return !!millis && Date.now() - millis < 20 * 60 * 1000;
}

export function CompanySellerUploadPanel() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [profile, setProfile] = useState<SellerProfile>(emptyProfile);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const isUploadPage = pathname === "/ikelti";

  useEffect(() => {
    if (!isUploadPage) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile({ ...emptyProfile, ...(JSON.parse(raw) as Partial<SellerProfile>) });
    } catch {}
  }, [isUploadPage]);

  const sellerPayload = useMemo<SellerPayload | null>(() => {
    const sellerName = profile.sellerName.trim();
    if (!profile.enabled || !sellerName) return null;
    return {
      sellerType: "company",
      sellerId: slugifySeller(sellerName),
      sellerName,
      sellerWebsite: profile.sellerWebsite.trim() || undefined,
      sellerWorkingHours: profile.sellerWorkingHours.trim() || undefined,
      sellerLogoUrl: profile.sellerLogoUrl.trim() || undefined,
      sellerCoverUrl: profile.sellerCoverUrl.trim() || undefined,
    };
  }, [profile]);

  useEffect(() => {
    if (!isUploadPage || !user?.uid || !sellerPayload) return;
    const payload = sellerPayload;

    async function patchNewest(collectionName: "ads" | "parts", docs: Listing[]) {
      const recentOwnDocs = docs
        .filter((x) => x.ownerUid === user!.uid)
        .filter((x) => !x.sellerName)
        .filter((x) => createdRecently(x.createdAt))
        .slice(0, 3);

      for (const item of recentOwnDocs) {
        await updateDoc(doc(db, collectionName, item.id), payload);
        setApplied(true);
      }
    }

    const unsubAds = onSnapshot(query(collection(db, "ads"), orderBy("createdAt", "desc")), (snap) => {
      patchNewest("ads", snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))).catch(() => {});
    });

    const unsubParts = onSnapshot(query(collection(db, "parts"), orderBy("createdAt", "desc")), (snap) => {
      patchNewest("parts", snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))).catch(() => {});
    });

    return () => {
      unsubAds();
      unsubParts();
    };
  }, [isUploadPage, user?.uid, sellerPayload]);

  if (!isUploadPage || !user) return null;

  function updateProfile(next: Partial<SellerProfile>) {
    setSaved(false);
    setApplied(false);
    setProfile((prev) => ({ ...prev, ...next }));
  }

  function saveProfile() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setSaved(true);
    } catch {}
  }

  return (
    <div className="mx-auto mt-4 w-full max-w-6xl px-4">
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={profile.enabled} onChange={(e) => updateProfile({ enabled: e.target.checked })} className="mt-1 h-5 w-5 accent-white" />
          <span>
            <span className="block text-sm font-black text-white">Esu įmonė / pardavėjas</span>
            <span className="mt-1 block text-xs font-semibold text-white/55">Nebūtina. Paprastiems žmonėms šios skilties pildyti nereikia.</span>
          </span>
        </label>

        {profile.enabled ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <input value={profile.sellerName} onChange={(e) => updateProfile({ sellerName: e.target.value })} placeholder="Įmonės pavadinimas" className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45" />
            <input value={profile.sellerWebsite} onChange={(e) => updateProfile({ sellerWebsite: e.target.value })} placeholder="Internetinė svetainė (nebūtina)" className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45" />
            <input value={profile.sellerWorkingHours} onChange={(e) => updateProfile({ sellerWorkingHours: e.target.value })} placeholder="Darbo laikas (nebūtina)" className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45" />
            <input value={profile.sellerLogoUrl} onChange={(e) => updateProfile({ sellerLogoUrl: e.target.value })} placeholder="Logotipo nuoroda (nebūtina)" className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45" />
            <input value={profile.sellerCoverUrl} onChange={(e) => updateProfile({ sellerCoverUrl: e.target.value })} placeholder="Viršelio nuotraukos nuoroda (nebūtina)" className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45 md:col-span-2" />
            <div className="flex flex-wrap items-center gap-2 md:col-span-2">
              <button type="button" onClick={saveProfile} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black hover:bg-white/90">Išsaugoti profilį</button>
              {saved ? <span className="text-xs font-bold text-emerald-200">Išsaugota ✅</span> : null}
              {applied ? <span className="text-xs font-bold text-blue-200">Profilis priskirtas naujam skelbimui ✅</span> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
