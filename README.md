# 소환사 관상 (Summoner Reading)

LoL 닉네임의 어감으로 관상·궁합·운세를 봐주는 라이브 AI 위젯. 결과는 공유 카드로 저장.
Vite + React. OP.GG AI-deathon 출품용.

---

## Claude Code 로 여는 법
1. 압축 풀고 폴더로 이동
2. `claude` 실행 → "npm install 하고 dev 서버 띄워줘" (또는 `npm install && npm run dev`)
3. http://localhost:5173

기본 **MOCK 모드** — 키 없이 즉시 작동. 닉만 넣으면 3모드 다 나온다.

## 모드
- 관상(solo) / 궁합(duo) / 운세(fortune) — 상단 탭

## 두 가지 호출 모드
| | 켜는 법 | 용도 |
|---|---|---|
| MOCK(기본) | 그대로 | 디자인 반복 |
| REAL | `.env.example`→`.env`, 키 입력 | 실제 AI 호출 |

## 어디를 만지나
| 파일 | 역할 | 디자이너 |
|---|---|---|
| `src/App.jsx` | UI·카드 전체 | **메인** |
| `src/theme.js` | 색·해시·점수 구간색 | **색** |
| `src/share.js` | canvas PNG 저장 | 저장본 손볼 때 |
| `src/ddragon.js` | 챔프 매핑·화이트리스트 | 챔프 풀 조정 |
| `src/anthropic.js` | 호출·목업·프롬프트 | 톤·칭호 |

## 핵심 동작
- 챔프/점수는 **닉 해시로 고정** (전적 아님) → 같은 닉=같은 결과
- 운세는 닉+KST날짜 시드 → 매일 바뀌되 하루 안엔 고정
- 챔프 이미지: ddragon 공개 CDN(키 불필요), 부팅 시 최신 버전+한글명 매핑 자동
- 저장 카드: canvas 1080×1350, 챔프 `crossOrigin="anonymous"` 필수

## REAL 모드 주의
브라우저 직접 호출이라 키가 번들에 노출 → 로컬·데모용만. 공개 배포 시 백엔드 프록시로 키 숨길 것.
