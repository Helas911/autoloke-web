import Link from "next/link";

export default function MoketaPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 text-white">
      <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-6">
        <div className="text-4xl">✅</div>
        <h1 className="mt-4 text-2xl font-black">Apmokėjimas priimtas</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-white/75">
          Skelbimas aktyvuosis po Stripe patvirtinimo. Įprastai tai įvyksta labai greitai. Skelbimas galios 30 dienų, o 31-ą dieną nepratęsus bus automatiškai ištrintas.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/transportas" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black hover:bg-white/90">
            Žiūrėti transportą
          </Link>
          <Link href="/dalys" className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-black text-white hover:bg-white/[0.08]">
            Žiūrėti detales
          </Link>
        </div>
      </div>
    </main>
  );
}
