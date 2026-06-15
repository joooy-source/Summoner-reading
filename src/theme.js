// ─── 해시 & 점수 색 ───
// 모든 수치/배정은 해시 고정 → 같은 입력 = 항상 같은 결과 (공유 일관성)

export function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// 0~99 점수
export function scoreFrom(seed) {
  return seed % 60 + 38; // 38~97, 너무 낮은 0점대 방지
}

// 점수 구간별 색 (낮으면 경고색 → "망했네ㅋㅋ"의 시각 펀치)
export function scoreColor(pct) {
  if (pct >= 70) return { bar: "linear-gradient(90deg,#7c9fe0,#b9a8f0)", text: "#b9a8f0", halo: "#6a4ea0" };
  if (pct >= 45) return { bar: "linear-gradient(90deg,#d0a85a,#e0c47c)", text: "#e0c47c", halo: "#9a7a3a" };
  return { bar: "linear-gradient(90deg,#c05a6a,#e07c8c)", text: "#e07c8c", halo: "#9a3a4a" };
}

// 챔프색에 맞춘 포인트(eyebrow/강조) — 해시로 몇 가지 중 배정
const ACCENTS = ["#b9a8f0", "#a8c4f0", "#8fd6c0", "#e0b88c", "#d6a8c4"];
export function accentFrom(seed) {
  return ACCENTS[seed % ACCENTS.length];
}
