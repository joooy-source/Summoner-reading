// ─── 관상 호출 ───
// MOCK 모드(기본): 키 없이 해시로 고정된 샘플 반환 → 디자인 반복용.
// REAL 모드: .env 에 VITE_USE_MOCK=false + VITE_ANTHROPIC_API_KEY.
//
// 디자인만 다듬을 거면 이 파일은 안 건드려도 된다.

import { hashStr, scoreFrom } from "./theme.js";
import { champFor } from "./ddragon.js";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

// ── MOCK 풀 (밈 공감형 칭호) ──
const READINGS = [
  { pre: "본대", em: "거부단", desc: "한타? 난 스플릿 간다. 팀은 4:5로 싸운다.", line: "탑", trait: "독고다이" },
  { pre: "갱 와도", em: "풀피러", desc: "오늘 너는 안 죽는다. 다이브? 환영이다.", line: "미드", trait: "생존형" },
  { pre: "닷지", em: "마스터", desc: "큐 잡고 도망가는 그 사람. 챔피언 select가 곧 전장.", line: "서폿", trait: "신중형" },
  { pre: "한타 여는", em: "폭군", desc: "이성보다 먼저 몸이 들어간다. 1킬 아니면 1데스.", line: "정글", trait: "공격형" },
  { pre: "0데스", em: "운영가", desc: "죽지 않는다. 대신 게임이 길어진다.", line: "원딜", trait: "안정형" },
  { pre: "스플릿의", em: "유령", desc: "혼자 사이드를 민다. 팀은 너를 못 찾는다.", line: "탑", trait: "고독형" },
];
const FORTUNES = [
  { pre: "한타 여는", em: "폭군", desc: "오늘은 너의 진입이 승리를 연다. 단, 21시 전 큐는 독.", line: "미드", time: "21–23시" },
  { pre: "오늘은", em: "캐리각", desc: "손이 풀린다. 자랭 돌려도 되는 날.", line: "원딜", time: "20–22시" },
  { pre: "조심해야 할", em: "하루", desc: "오늘은 욕심을 버려라. 무리한 다이브가 패배를 부른다.", line: "서폿", time: "22–24시" },
  { pre: "운영의", em: "날", desc: "급하게 굴지 마라. 기다리면 길이 열린다.", line: "정글", time: "19–21시" },
];
const DUOS = [
  { pre: "환상의", em: "듀오", synergy: "이니시 호응", risk: "둘 다 다이브충", verdict: "듀오 큐 ㄱㄱ" },
  { pre: "애증의", em: "콤비", synergy: "캐리 갈아타기", risk: "한타 콜 충돌", verdict: "할 만하다" },
  { pre: "같은 큐 잡으면", em: "안 될 사이", synergy: "거의 없음", risk: "서로 트롤 의심", verdict: "솔로 큐 권장" },
];

function pick(arr, seed) { return arr[seed % arr.length]; }

export async function read(mode, nameA, nameB = "") {
  if (USE_MOCK || !KEY) {
    await new Promise((r) => setTimeout(r, 650));
    return mock(mode, nameA, nameB);
  }
  return real(mode, nameA, nameB);
}

function mock(mode, a, b) {
  const seed = hashStr(a + b);
  if (mode === "duo") {
    const d = pick(DUOS, seed);
    return {
      mode, no: (seed % 900000 + 100000),
      champ: champFor(a), champ2: champFor(b),
      pre: d.pre, em: d.em, nick: `@${a} × @${b}`,
      score: scoreFrom(seed),
      fields: [["시너지", d.synergy], ["리스크", d.risk], ["판정", d.verdict]],
    };
  }
  if (mode === "fortune") {
    const f = pick(FORTUNES, seed);
    return {
      mode, no: null, champ: champFor(a + "fortune"),
      eyebrow: "오늘 너의 칭호", pre: f.pre, em: f.em, desc: f.desc, nick: `@${a}`,
      score: scoreFrom(seed),
      fields: [["행운 라인", f.line], ["행운 시간", f.time], ["오늘 기운", String(scoreFrom(seed))]],
    };
  }
  const r = pick(READINGS, seed);
  return {
    mode, no: (seed % 900000 + 100000), champ: champFor(a),
    eyebrow: "너의 정체", pre: r.pre, em: r.em, desc: r.desc, nick: `@${a}`,
    fields: [["주 라인", r.line], ["기질", r.trait], ["주력 챔프", champFor(a).name]],
  };
}

const SYS = {
  solo: `LoL 소환사명의 어감만으로 "관상"을 본다. 전적 데이터는 없다.
밈 공감형 게이머 칭호를 짓는다(예: 본대 거부단, 갱 와도 풀피러, 닷지 마스터). 자학이라도 귀여운 선. 해석이 필요한 말장난 금지.
JSON만 출력: {"pre":"칭호 앞부분","em":"칭호 강조단어(합쳐서 최대 8자, 2줄)","desc":"한 줄 풀이(2문장)","line":"주 라인","trait":"기질 한 단어"}`,
  fortune: `LoL 소환사명 + 오늘 날짜로 "오늘의 운세"를 본다.
JSON만: {"pre":"오늘의 칭호 앞","em":"강조단어","desc":"오늘 운세 1~2문장","line":"행운 라인","time":"행운 시간대(예: 21–23시)"}`,
  duo: `두 LoL 소환사명의 듀오 궁합을 본다.
JSON만: {"pre":"케미 앞","em":"강조단어","synergy":"시너지 한 줄","risk":"리스크 한 줄","verdict":"판정 한 줄"}`,
};

async function real(mode, a, b) {
  const sys = mode === "duo" ? SYS.duo : mode === "fortune" ? SYS.fortune : SYS.solo;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const u = mode === "duo" ? `소환사1: "${a}"\n소환사2: "${b}"`
    : mode === "fortune" ? `소환사명: "${a}"\n오늘 날짜(KST): ${today}`
    : `소환사명: "${a}"`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6", max_tokens: 1000,
      messages: [{ role: "user", content: `${sys}\n\n${u}` }],
    }),
  });
  const data = await res.json();
  const text = data.content.filter((x) => x.type === "text").map((x) => x.text).join("");
  const j = JSON.parse(text.replace(/```json|```/g, "").trim());
  const seed = hashStr(a + b);

  if (mode === "duo") return {
    mode, no: seed % 900000 + 100000, champ: champFor(a), champ2: champFor(b),
    pre: j.pre, em: j.em, nick: `@${a} × @${b}`, score: scoreFrom(seed),
    fields: [["시너지", j.synergy], ["리스크", j.risk], ["판정", j.verdict]],
  };
  if (mode === "fortune") return {
    mode, no: null, champ: champFor(a + "fortune"),
    eyebrow: "오늘 너의 칭호", pre: j.pre, em: j.em, desc: j.desc, nick: `@${a}`, score: scoreFrom(seed),
    fields: [["행운 라인", j.line], ["행운 시간", j.time], ["오늘 기운", String(scoreFrom(seed))]],
  };
  return {
    mode, no: seed % 900000 + 100000, champ: champFor(a),
    eyebrow: "너의 정체", pre: j.pre, em: j.em, desc: j.desc, nick: `@${a}`,
    fields: [["주 라인", j.line], ["기질", j.trait], ["주력 챔프", champFor(a).name]],
  };
}
