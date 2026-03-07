export type MapMarkerItem = {
  id: string;
  price?: number;
  lat?: number;
  lng?: number;
};

export function bubbleIcon(text: string, kind: "price" | "count") {
  const pad = 14;
  const fontSize = kind === "count" ? 14 : 12;
  const t = String(text);
  const w = Math.max(38, t.length * 8 + pad);
  const h = 30;
  const bg = kind === "count" ? "#0b1220" : "#0b3bff";
  const stroke = "rgba(255,255,255,0.35)";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect x="1" y="1" rx="14" ry="14" width="${w - 2}" height="${h - 2}" fill="${bg}" stroke="${stroke}" />
      <text x="${w / 2}" y="${h / 2 + fontSize / 3}" text-anchor="middle"
            font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="800" fill="#fff">${t}</text>
    </svg>`;
  const url = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  return {
    url,
    scaledSize: new google.maps.Size(w, h),
    anchor: new google.maps.Point(w / 2, h / 2),
  } as google.maps.Icon;
}

export function groupMarkers<T extends MapMarkerItem>(items: T[], zoom: number) {
  const withPos = items.filter((i) => typeof i.lat === "number" && typeof i.lng === "number");
  const z = zoom || 7;
  const decimals = z <= 6 ? 1 : z <= 8 ? 2 : z <= 11 ? 3 : 4;
  const keyOf = (i: T) => `${i.lat!.toFixed(decimals)}:${i.lng!.toFixed(decimals)}`;

  const groups = new Map<string, T[]>();
  for (const it of withPos) {
    const k = keyOf(it);
    const arr = groups.get(k) || [];
    arr.push(it);
    groups.set(k, arr);
  }

  return [...groups.entries()].map(([k, arr]) => {
    const [laS, lnS] = k.split(":");
    const la = Number(laS);
    const ln = Number(lnS);
    return { key: k, items: arr, pos: { lat: la, lng: ln } };
  });
}
