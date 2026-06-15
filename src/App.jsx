// ─── 소환사 관상 — UI ───
// 디자인은 주로 여기서 다듬는다. 색/해시는 theme.js, 챔프는 ddragon.js, 저장은 share.js.

import React, { useEffect, useState } from "react";
import { initDDragon, loadingUrl } from "./ddragon.js";
import { read } from "./anthropic.js";
import { saveCard } from "./share.js";
import { scoreColor } from "./theme.js";

const MODES = [
  { key: "solo", label: "관상" },
  { key: "duo", label: "궁합" },
  { key: "fortune", label: "운세" },
];

export default function App() {
  const [mode, setMode] = useState("solo");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { initDDragon(); }, []);

  async function go() {
    if (!a.trim() || (mode === "duo" && !b.trim())) return;
    setLoading(true); setErr(""); setResult(null);
    try {
      setResult(await read(mode, a.trim(), b.trim()));
    } catch (e) {
      setErr("기운을 읽지 못했다. 다시 시도하라.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m) { setMode(m); setResult(null); setErr(""); }

  return (
    <div style={S.page}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={S.kicker}>召喚士 觀相</div>
          <h1 style={S.h1}>소환사 관상</h1>
          <p style={S.sub}>이름에 깃든 기운을 읽는다. 전적은 보지 않는다.</p>
        </div>

        <div style={S.tabs}>
          {MODES.map((m) => (
            <button key={m.key} onClick={() => switchMode(m.key)}
              style={{ ...S.tab, ...(mode === m.key ? S.tabOn : {}) }}>{m.label}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
          <input value={a} onChange={(e) => setA(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder={mode === "duo" ? "내 소환사명" : "소환사명을 적으시오"} style={S.input} />
          {mode === "duo" && (
            <input value={b} onChange={(e) => setB(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()}
              placeholder="듀오 소환사명" style={S.input} />
          )}
          <button onClick={go} disabled={loading} style={S.cta}>
            {loading ? "기운을 읽는 중…" : mode === "duo" ? "궁합 보기" : mode === "fortune" ? "오늘 운세 보기" : "관상 보기"}
          </button>
        </div>

        {err && <p style={{ color: "#e07c8c", fontSize: 14, textAlign: "center" }}>{err}</p>}

        {result && (
          <>
            <PosterCard r={result} />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => saveCard(result)} style={S.save}>⬇ 카드 저장</button>
              <button onClick={() => setResult(null)} style={S.again}>다시</button>
            </div>
            {mode === "fortune" && (
              <p style={S.tomorrow}>내일의 운세는 자정에 열린다.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PosterCard({ r }) {
  const sc = r.score != null ? scoreColor(r.score) : { halo: "#6a4ea0", bar: "linear-gradient(90deg,#7c9fe0,#b9a8f0)", text: "#b9a8f0" };
  const duo = r.mode === "duo";

  return (
    <div style={C.card}>
      <div style={{ ...C.halo, background: `radial-gradient(circle,${sc.halo}33 0%,transparent 62%)` }} />
      {duo ? (
        <div style={C.duoHero}>
          <div style={C.half}><img src={loadingUrl(r.champ.id)} alt="" style={C.heroImg} /></div>
          <div style={C.half}><img src={loadingUrl(r.champ2.id)} alt="" style={C.heroImg} /></div>
          <div style={C.seam} />
          <div style={C.fade} />
        </div>
      ) : (
        <div style={C.hero}>
          <img src={loadingUrl(r.champ.id)} alt="" style={C.heroImg} />
          <div style={C.fade} />
        </div>
      )}

      <div style={C.ui}>
        <div style={C.top}>
          <span style={C.badge}>{duo ? "듀오 궁합" : r.mode === "fortune" ? "오늘의 운세" : "소환사 자격증"}</span>
          {r.no != null ? <span style={C.no}>No. {r.no}</span>
            : <span style={C.no}>{kstDate()}</span>}
        </div>

        {duo && (
          <div style={C.pctBig}>
            <div style={{ ...C.pctN, color: "#fff" }}>{r.score}<span style={{ fontSize: 28 }}>%</span></div>
            <div style={C.pctK}>궁합도</div>
          </div>
        )}

        <div style={C.bottom}>
          {duo && (
            <div style={C.track}><div style={{ ...C.fill, width: `${r.score}%`, background: sc.bar }} /></div>
          )}
          <div style={{ ...C.eyebrow, color: sc.text }}>{r.eyebrow || "케미"}</div>
          <div style={C.title}>{r.pre} <em style={{ fontStyle: "normal", color: sc.text }}>{r.em}</em></div>
          {r.desc && <div style={C.desc}>{r.desc}</div>}
          <div style={C.nick}>{r.nick}</div>
          <div style={C.meta}>
            {r.fields.map((f) => (
              <div key={f[0]} style={C.metaItem}>
                <span style={C.metaK}>{f[0]}</span><span style={C.metaV}>{f[1]}</span>
              </div>
            ))}
          </div>
          <div style={C.foot}>League of Legends © Riot Games · summoner-reading.app</div>
        </div>
      </div>
    </div>
  );
}

function kstDate() {
  const d = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" }).format(new Date());
  return d;
}

const S = {
  page: { minHeight: "100vh", background: "#070709", color: "#e7e1f7", display: "flex", justifyContent: "center", padding: "44px 20px" },
  kicker: { fontSize: 12, letterSpacing: 6, color: "#9b8fd0", marginBottom: 10 },
  h1: { fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 6px", letterSpacing: -1 },
  sub: { fontSize: 14, color: "#8b87a0", margin: 0 },
  tabs: { display: "flex", gap: 6, background: "#15131f", padding: 5, borderRadius: 14, marginBottom: 16 },
  tab: { flex: 1, padding: "10px 0", fontSize: 15, fontWeight: 700, color: "#8b87a0", background: "transparent", border: "none", borderRadius: 10, cursor: "pointer" },
  tabOn: { background: "#2a2540", color: "#fff" },
  input: { padding: "14px 16px", fontSize: 16, background: "#15131f", border: "1px solid #272336", borderRadius: 12, color: "#fff", outline: "none" },
  cta: { padding: "15px 0", fontSize: 16, fontWeight: 800, color: "#fff", background: "#6a4ea0", border: "none", borderRadius: 12, cursor: "pointer" },
  save: { flex: 1, padding: "13px 0", fontSize: 15, fontWeight: 700, color: "#cdc6e2", background: "transparent", border: "1px solid #3a3450", borderRadius: 12, cursor: "pointer" },
  again: { flex: 1, padding: "13px 0", fontSize: 15, fontWeight: 700, color: "#8b87a0", background: "transparent", border: "1px solid #272336", borderRadius: 12, cursor: "pointer" },
  tomorrow: { textAlign: "center", color: "#6f6a82", fontSize: 13, marginTop: 14 },
};

const C = {
  card: { width: "100%", aspectRatio: "330 / 472", maxWidth: 380, borderRadius: 26, position: "relative", overflow: "hidden", background: "#0c0b12", margin: "0 auto" },
  halo: { position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: "100%", paddingBottom: "100%", borderRadius: "50%" },
  hero: { position: "absolute", inset: 0 },
  duoHero: { position: "absolute", inset: 0, display: "flex" },
  half: { width: "50%", height: "78%", overflow: "hidden", position: "relative" },
  heroImg: { width: "100%", height: "78%", objectFit: "cover", objectPosition: "top center", filter: "saturate(.92) contrast(1.02)" },
  seam: { position: "absolute", left: "50%", top: 0, width: 60, height: "78%", transform: "translateX(-50%)", background: "linear-gradient(90deg,transparent,rgba(12,11,18,.6),transparent)" },
  fade: { position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(12,11,18,0) 30%, rgba(12,11,18,.55) 52%, rgba(12,11,18,.92) 68%, #0c0b12 80%)" },
  ui: { position: "absolute", inset: 0, padding: "22px 24px", display: "flex", flexDirection: "column" },
  top: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  badge: { background: "rgba(255,255,255,.1)", backdropFilter: "blur(8px)", color: "#d6d2e2", fontSize: 11, fontWeight: 600, letterSpacing: .5, padding: "6px 12px", borderRadius: 99 },
  no: { color: "#b9b4c8", fontSize: 12, fontWeight: 500, textShadow: "0 1px 6px rgba(0,0,0,.6)" },
  pctBig: { position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" },
  pctN: { fontSize: 60, fontWeight: 800, letterSpacing: -3, lineHeight: 1, textShadow: "0 4px 30px rgba(0,0,0,.7)" },
  pctK: { color: "#cdc6e2", fontSize: 12, fontWeight: 600, letterSpacing: 1, marginTop: 2 },
  bottom: { marginTop: "auto" },
  track: { height: 6, background: "rgba(255,255,255,.12)", borderRadius: 99, overflow: "hidden", marginBottom: 14 },
  fill: { height: "100%", borderRadius: 99 },
  eyebrow: { fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 7 },
  title: { color: "#fff", fontSize: 32, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.08 },
  desc: { color: "#a5a0b8", fontSize: 13, lineHeight: 1.5, marginTop: 9 },
  nick: { color: "#8b87a0", fontSize: 13, fontWeight: 500, marginTop: 8 },
  meta: { display: "flex", gap: 18, marginTop: 16, borderTop: "1px solid rgba(255,255,255,.09)", paddingTop: 14 },
  metaItem: { display: "flex", flexDirection: "column", gap: 3 },
  metaK: { color: "#6f6a82", fontSize: 10, fontWeight: 500, letterSpacing: .5 },
  metaV: { color: "#ddd8ea", fontSize: 14, fontWeight: 700 },
  foot: { color: "#4d495c", fontSize: 9, marginTop: 13, letterSpacing: .3 },
};
