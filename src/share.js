// ─── 공유 카드 PNG 저장 ───
// 화면 포스터 카드를 canvas로 재현. 1080×1350(4:5).
// 챔프 이미지는 crossOrigin 필수 (없으면 toDataURL 보안에러).

import { loadingUrl } from "./ddragon.js";
import { scoreColor } from "./theme.js";

function loadImg(url) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });
}

// 한글 글자 단위 줄바꿈
function wrap(c, text, x, y, maxW, lh, align = "left") {
  const chars = [...text]; let line = ""; let yy = y;
  c.textAlign = align;
  for (const ch of chars) {
    if (c.measureText(line + ch).width > maxW && line) {
      c.fillText(line, x, yy); line = ch; yy += lh;
    } else line += ch;
  }
  if (line) c.fillText(line, x, yy);
  return yy;
}

export async function saveCard(r) {
  const W = 1080, H = 1350;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  c.fillStyle = "#0c0b12"; c.fillRect(0, 0, W, H);

  const sc = r.score != null ? scoreColor(r.score) : { halo: "#6a4ea0", bar: "linear-gradient(90deg,#7c9fe0,#b9a8f0)", text: "#b9a8f0" };

  // 챔프 이미지 (풀블리드 상단)
  try {
    const heroH = H * 0.78;
    if (r.mode === "duo") {
      const [a, b] = await Promise.all([loadImg(loadingUrl(r.champ.id)), loadImg(loadingUrl(r.champ2.id))]);
      drawCover(c, a, 0, 0, W / 2, heroH);
      drawCover(c, b, W / 2, 0, W / 2, heroH);
    } else {
      const img = await loadImg(loadingUrl(r.champ.id));
      drawCover(c, img, 0, 0, W, heroH);
    }
  } catch (e) { /* 이미지 실패해도 텍스트는 그림 */ }

  // 하단 페이드
  const g = c.createLinearGradient(0, H * 0.3, 0, H * 0.8);
  g.addColorStop(0, "rgba(12,11,18,0)");
  g.addColorStop(0.45, "rgba(12,11,18,0.6)");
  g.addColorStop(0.72, "rgba(12,11,18,0.95)");
  g.addColorStop(1, "#0c0b12");
  c.fillStyle = g; c.fillRect(0, H * 0.3, W, H * 0.7);

  const PAD = 76;
  // 상단 badge
  c.textAlign = "left";
  c.font = "600 32px Pretendard, sans-serif";
  const badge = r.mode === "duo" ? "듀오 궁합" : r.mode === "fortune" ? "오늘의 운세" : "소환사 자격증";
  c.fillStyle = "#d6d2e2"; c.fillText(badge, PAD, PAD + 30);
  if (r.no != null) {
    c.textAlign = "right"; c.fillStyle = "#b9b4c8"; c.font = "500 30px Pretendard, sans-serif";
    c.fillText(`No. ${r.no}`, W - PAD, PAD + 30);
  }

  // 궁합 큰 % (포스터 위 중앙)
  if (r.mode === "duo") {
    c.textAlign = "center";
    c.fillStyle = "#fff"; c.font = "800 150px Pretendard, sans-serif";
    c.fillText(`${r.score}%`, W / 2, H * 0.34);
    c.fillStyle = "#cdc6e2"; c.font = "600 32px Pretendard, sans-serif";
    c.fillText("궁합도", W / 2, H * 0.34 + 50);
  }

  // 하단 콘텐츠
  let y = H - 360;
  c.textAlign = "left";
  if (r.eyebrow) {
    c.fillStyle = sc.text; c.font = "600 30px Pretendard, sans-serif";
    c.fillText(r.eyebrow, PAD, y); y += 56;
  } else if (r.mode === "duo") {
    c.fillStyle = sc.text; c.font = "600 30px Pretendard, sans-serif";
    c.fillText("케미", PAD, y); y += 56;
  }
  // 칭호 (pre 흰 + em 강조)
  c.font = "800 92px Pretendard, sans-serif";
  c.fillStyle = "#fff"; c.fillText(r.pre, PAD, y); y += 100;
  c.fillStyle = sc.text; c.fillText(r.em, PAD, y); y += 70;
  // desc / nick
  if (r.desc) {
    c.fillStyle = "#a5a0b8"; c.font = "500 34px Pretendard, sans-serif";
    y = wrap(c, r.desc.replace(/\n/g, " "), PAD, y, W - PAD * 2, 46) + 50;
  } else { y += 12; }
  c.fillStyle = "#8b87a0"; c.font = "500 32px Pretendard, sans-serif";
  c.fillText(r.nick, PAD, y); y += 56;

  // 필드 가로 정렬
  c.fillStyle = "rgba(255,255,255,0.1)"; c.fillRect(PAD, y - 4, W - PAD * 2, 1);
  y += 40;
  const colW = (W - PAD * 2) / r.fields.length;
  r.fields.forEach((f, i) => {
    const x = PAD + colW * i;
    c.textAlign = "left";
    c.fillStyle = "#6f6a82"; c.font = "500 26px Pretendard, sans-serif";
    c.fillText(f[0], x, y);
    c.fillStyle = "#ddd8ea"; c.font = "700 36px Pretendard, sans-serif";
    c.fillText(f[1], x, y + 44);
  });

  // footer
  c.textAlign = "center"; c.fillStyle = "#4d495c"; c.font = "500 22px Pretendard, sans-serif";
  c.fillText("League of Legends © Riot Games · summoner-reading.app", W / 2, H - 44);

  const a = document.createElement("a");
  a.download = `소환사관상_${r.nick.replace(/[@ ×]/g, "")}.png`;
  a.href = cv.toDataURL("image/png");
  a.click();
}

// object-fit: cover (top) 재현
function drawCover(c, img, dx, dy, dw, dh) {
  const ir = img.width / img.height, dr = dw / dh;
  let sw, sh, sx, sy;
  if (ir > dr) { sh = img.height; sw = sh * dr; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / dr; sx = 0; sy = 0; } // top 정렬
  c.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}
