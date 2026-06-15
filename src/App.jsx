import React, { useState, useRef } from "react";

// ─── 오행(五行) 테마: 닉 해시로 결정 → 같은 닉은 항상 같은 기운 ───
const ELEMENTS = {
  火: { name: "火 · 불의 기운", sub: "Fire", bg: "#1a0e0e", glow: "#ff5a3c", ink: "#ffd9b0", line: "#7a2418", accent: "#ff6b47" },
  水: { name: "水 · 물의 기운", sub: "Water", bg: "#0b1018", glow: "#3c8cff", ink: "#bcd6ff", line: "#163a5f", accent: "#5aa0ff" },
  木: { name: "木 · 나무의 기운", sub: "Wood", bg: "#0c140e", glow: "#3cff8a", ink: "#bfe9cc", line: "#1d4a2d", accent: "#52d98a" },
  金: { name: "金 · 쇠의 기운", sub: "Metal", bg: "#15120a", glow: "#ffd23c", ink: "#f0e3b8", line: "#5f4d16", accent: "#e9c44a" },
  土: { name: "土 · 흙의 기운", sub: "Earth", bg: "#140f0b", glow: "#c98a4a", ink: "#e6cfb0", line: "#5a3d22", accent: "#cf9a5a" },
};
const ELEM_KEYS = ["火", "水", "木", "金", "土"];

function hashName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

export default function App() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [elem, setElem] = useState(null);
  const [err, setErr] = useState("");
  const cardRef = useRef(null);

  async function read() {
    const n = name.trim();
    if (!n) return;
    setLoading(true); setErr(""); setResult(null);
    const theme = ELEMENTS[ELEM_KEYS[hashName(n) % 5]];
    setElem(theme);
    try {
      const res = await fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "실패");
      setResult(data);
    } catch (e) {
      setErr("기운을 읽지 못했다. 닉을 바꾸거나 다시 시도하라.");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!result || !elem) return;
    const W = 1080, H = 1350, P = 80;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    // 배경
    const g = c.createRadialGradient(W / 2, H * 0.32, 80, W / 2, H * 0.32, H);
    g.addColorStop(0, elem.line); g.addColorStop(1, elem.bg);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // 테두리
    c.strokeStyle = elem.glow; c.lineWidth = 3;
    c.strokeRect(P / 2, P / 2, W - P, H - P);
    c.strokeStyle = elem.line; c.lineWidth = 1;
    c.strokeRect(P / 2 + 10, P / 2 + 10, W - P - 20, H - P - 20);

    const cx = W / 2;
    c.textAlign = "center";
    // 한자 기운
    c.fillStyle = elem.glow; c.font = "bold 180px serif";
    c.fillText(elem.name.charAt(0), cx, 320);
    c.fillStyle = elem.accent; c.font = "28px serif";
    c.fillText(elem.sub.toUpperCase() + "  ·  소환사 관상", cx, 380);
    // 닉
    c.fillStyle = "#fff"; c.font = "bold 64px serif";
    c.fillText(name.trim(), cx, 480);
    // 한 줄 정의
    c.fillStyle = elem.ink; c.font = "italic 40px serif";
    wrap(c, `"${result.oneLiner}"`, cx, 560, 880, 50);

    // 본문 블록
    const blocks = [
      ["플레이 성향", result.playstyle],
      ["봉인된 운명", result.fate],
      ["찰떡 포지션", result.position],
      ["경고", result.warning],
    ];
    let y = 700;
    c.textAlign = "left";
    blocks.forEach(([label, body]) => {
      c.fillStyle = elem.accent; c.font = "bold 30px serif";
      c.fillText("◆ " + label, P + 20, y);
      c.fillStyle = elem.ink; c.font = "28px serif";
      y = wrap(c, body, null, y + 44, W - 2 * P - 40, 40, P + 20) + 50;
    });
    c.textAlign = "center";
    c.fillStyle = elem.accent; c.font = "24px serif";
    c.fillText("소환사 관상 · summoner physiognomy", cx, H - P);

    const a = document.createElement("a");
    a.download = `관상_${name.trim()}.png`;
    a.href = cv.toDataURL("image/png");
    a.click();
  }

  // 한국어 글자 단위 줄바꿈
  function wrap(c, text, cx, y, maxW, lh, left) {
    const chars = [...text]; let line = ""; let yy = y;
    for (const ch of chars) {
      if (c.measureText(line + ch).width > maxW && line) {
        cx != null ? c.fillText(line, cx, yy) : c.fillText(line, left, yy);
        line = ch; yy += lh;
      } else line += ch;
    }
    if (line) cx != null ? c.fillText(line, cx, yy) : c.fillText(line, left, yy);
    return yy;
  }

  const t = elem || ELEMENTS["金"];
  const serif = "'Apple SD Gothic Neo','Nanum Myeongjo',ui-serif,Georgia,serif";

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.ink, fontFamily: serif,
      display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px",
      transition: "background .6s ease" }}>
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 13, letterSpacing: 6, color: t.accent, marginBottom: 12 }}>
          召喚士 觀相
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
          소환사 관상
        </h1>
        <p style={{ fontSize: 15, opacity: 0.7, marginBottom: 36 }}>
          이름 석 자에 깃든 기운을 읽는다. 전적은 보지 않는다.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          <input value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && read()}
            placeholder="소환사명을 적으시오"
            style={{ flex: 1, padding: "14px 18px", fontSize: 16, fontFamily: serif,
              background: "rgba(255,255,255,.04)", border: `1px solid ${t.line}`,
              borderRadius: 4, color: "#fff", outline: "none" }} />
          <button onClick={read} disabled={loading}
            style={{ padding: "0 24px", fontSize: 16, fontFamily: serif, fontWeight: 700,
              background: t.glow, color: t.bg, border: "none", borderRadius: 4,
              cursor: "pointer", whiteSpace: "nowrap" }}>
            {loading ? "보는 중…" : "관상 보기"}
          </button>
        </div>

        {err && <p style={{ color: t.accent, fontSize: 14 }}>{err}</p>}

        {loading && (
          <div style={{ fontSize: 14, opacity: 0.6, letterSpacing: 2 }}>
            ☯ 기운을 읽는 중…
          </div>
        )}

        {result && elem && (
          <>
            <div ref={cardRef} style={{ textAlign: "left", border: `1px solid ${elem.line}`,
              borderRadius: 6, padding: "36px 32px", background: "rgba(0,0,0,.25)",
              boxShadow: `0 0 60px ${elem.glow}22` }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 88, fontWeight: 700, color: elem.glow, lineHeight: 1,
                  textShadow: `0 0 30px ${elem.glow}66` }}>{elem.name.charAt(0)}</div>
                <div style={{ fontSize: 12, letterSpacing: 4, color: elem.accent, marginTop: 6 }}>
                  {elem.sub.toUpperCase()} · {name.trim()}
                </div>
              </div>
              <p style={{ textAlign: "center", fontSize: 24, fontStyle: "italic", color: "#fff",
                margin: "0 0 28px", lineHeight: 1.4 }}>"{result.oneLiner}"</p>
              {[["플레이 성향", result.playstyle], ["봉인된 운명", result.fate],
                ["찰떡 포지션", result.position], ["경고", result.warning]].map(([l, b]) => (
                <div key={l} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2,
                    color: elem.accent, marginBottom: 6 }}>◆ {l}</div>
                  <div style={{ fontSize: 15, lineHeight: 1.6, color: elem.ink }}>{b}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={download}
                style={{ flex: 1, padding: "13px", fontSize: 15, fontFamily: serif, fontWeight: 700,
                  background: "transparent", color: elem.glow, border: `1px solid ${elem.glow}`,
                  borderRadius: 4, cursor: "pointer" }}>
                ⬇ 카드 저장
              </button>
              <button onClick={() => { setResult(null); setName(""); }}
                style={{ flex: 1, padding: "13px", fontSize: 15, fontFamily: serif,
                  background: "transparent", color: t.ink, border: `1px solid ${t.line}`,
                  borderRadius: 4, cursor: "pointer", opacity: 0.7 }}>
                다른 이름 보기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
