import Link from "next/link";

export default function IkeltiPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Įkelti skelbimą</h1>
        <nav style={{ display: "flex", gap: 10 }}>
          <Link href="/transportas" style={btn()}>Transportas</Link>
          <Link href="/dalys" style={btn()}>Dalys</Link>
          <Link href="/" style={btn(true)}>Home</Link>
        </nav>
      </header>

      <div style={{ marginTop: 16, padding: 16, borderRadius: 16, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)" }}>
        Čia padarysim 2 tab’us: <b>Transportas</b> ir <b>Dalys</b> su nuotraukų įkėlimu į Firebase Storage.
        <div style={{ marginTop: 10, opacity: 0.85 }}>
          Kad galėtume kurti/redaguoti: įjungsim Auth (email/password) ir įdėsim upload.
        </div>
      </div>
    </main>
  );
}

function btn(ghost = false): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: ghost ? "transparent" : "rgba(255,255,255,0.06)",
    textDecoration: "none",
    color: "inherit",
    fontWeight: 600,
  };
}