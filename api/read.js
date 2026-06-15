const SYSTEM = `당신은 LoL 소환사명을 보고 관상을 보는 신비로운 점술가다.
닉네임의 글자, 어감, 분위기만 보고 직관적으로 풀이한다. 실제 전적 데이터는 없다.
말투는 진지한 관상가지만, 게이머의 정곡을 찌르는 팩폭 드립이 섞여야 한다. 진지함 60 / 드립 40.
반드시 아래 JSON만 출력. 마크다운·설명·코드펜스 금지.
{
 "oneLiner": "이 소환사를 한 문장으로 정의 (15자 내외, 강렬하게)",
 "playstyle": "플레이 성향 풀이 (2문장, 닉의 어감 근거로)",
 "fate": "봉인된 운명 (2문장, 약간 신비롭고 불길하거나 거창하게)",
 "position": "찰떡 포지션 추천 + 한 줄 이유",
 "warning": "경고 한 줄 (뼈 때리는 게이머 팩폭)"
}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." });
    return;
  }

  const name = (req.body?.name || "").trim();
  if (!name) {
    res.status(400).json({ error: "소환사명이 비어있습니다." });
    return;
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: `${SYSTEM}\n\n소환사명: "${name}"` }],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: data?.error?.message || "API 호출 실패" });
      return;
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    res.status(200).json(result);
  } catch (e) {
    res.status(502).json({ error: "기운을 읽지 못했다." });
  }
}
