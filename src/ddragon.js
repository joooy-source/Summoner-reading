// ─── Riot Data Dragon ───
// 공개 CDN(키 불필요). 부팅 시 최신 버전 + 한글 챔프명 매핑을 받아둔다.
// 전적이 아니라 "어감(해시)"으로 챔프를 배정한다.

import { hashStr } from "./theme.js";

let VERSION = "16.11.1"; // 부팅 전 폴백
let ID_TO_NAME = {};     // 영문 id → 한글명

// 로딩아트 크롭(상단 얼굴)이 잘 잡히는 챔프만 화이트리스트.
// 전신 포즈/옆모습 챔프는 포스터에서 어색해서 제외.
export const WHITELIST = [
  "Ahri", "Yasuo", "Lux", "Jinx", "Ezreal", "Tryndamere", "Thresh", "Leona",
  "Garen", "Darius", "Katarina", "Zed", "Akali", "Ashe", "Caitlyn", "Vi",
  "Jhin", "Lucian", "Riven", "Irelia", "Fiora", "Camille", "Sett", "Yone",
  "Aphelios", "Senna", "Seraphine", "Kaisa", "Evelynn", "Morgana",
  "MissFortune", "Vayne", "Ekko", "Sylas", "Viego", "Gwen", "Lulu", "Soraka",
];

export async function initDDragon() {
  try {
    const vs = await fetch("https://ddragon.leagueoflegends.com/api/versions.json").then((r) => r.json());
    VERSION = vs[0];
    const data = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/ko_KR/champion.json`
    ).then((r) => r.json());
    ID_TO_NAME = {};
    Object.values(data.data).forEach((c) => { ID_TO_NAME[c.id] = c.name; });
  } catch (e) {
    // 네트워크 실패해도 폴백 버전 + 영문 id로 동작
  }
  return VERSION;
}

export const iconUrl = (id) =>
  `https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/champion/${id}.png`;
export const loadingUrl = (id) =>
  `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${id}_0.jpg`;

export const nameOf = (id) => ID_TO_NAME[id] || id;

// 닉(또는 닉+모드) 해시로 화이트리스트에서 챔프 하나 배정
export function champFor(seedStr) {
  const id = WHITELIST[hashStr(seedStr + "#champ") % WHITELIST.length];
  return { id, name: nameOf(id) };
}
