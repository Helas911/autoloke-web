"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

const inputClass =
  "w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-yellow-300/40";

const cities = ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Jurbarkas", "Tauragė", "Telšiai", "Utena"];

const requestCategories = [
  "Perku automobilį",
  "Ieškau detalių",
  "Ardomi automobiliai",
  "Superku automobilius",
  "Ieškau motociklo",
  "Perku techniką",
  "Kita",
];

const actionCards = [
  {
    title: "Perku automobilį",
    subtitle: "Įdėk skelbimą, kokio automobilio ieškai",
    icon: "🔎",
    category: "Perku automobilį",
    type: "category",
    className: "border-blue-400/25 bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    title: "Ieškau detalių",
    subtitle: "Rask reikiamas dalis pagal markę ir modelį",
    icon: "🛠",
    category: "Ieškau detalių",
    type: "category",
    className: "border-yellow-400/25 bg-yellow-500/10 hover:bg-yellow-500/20",
  },
  {
    title: "Ardomi automobiliai",
    subtitle: "Įdėk ardomą automobilį, kad žmonės rastų dalis",
    icon: "♻️",
    category: "Ardomi automobiliai",
    type: "category",
    className: "border-red-400/25 bg-red-500/10 hover:bg-red-500/20",
  },
  {
    title: "Superku automobilius",
    subtitle: "Supirkimo skelbimai visoms markėms",
    icon: "💰",
    category: "Superku automobilius",
    type: "category",
    className: "border-green-400/25 bg-green-500/10 hover:bg-green-500/20",
  },
];

export default function Page(){return null}
