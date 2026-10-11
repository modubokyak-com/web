# modubokyak.com — 회사 사이트 · 웹 1분 복용 점검

정적 사이트입니다(빌드 단계 없음). **이 저장소의 HTML은 손으로 고치지 마세요** — 빌드 결과물이라 다음 빌드 때 덮어쓰입니다.

- 원본: 팀 iCloud `Projects/modu-bokyak/store-assets/common/*.html`
- 빌드: `cd store-assets && python3 소스/웹사이트-빌드.py --launch --with-check` → `store-assets/웹사이트/`
- 올리기: `rsync -a --delete --exclude .git --exclude .gitignore --exclude README.md --exclude .vercelignore --exclude .vercel store-assets/웹사이트/ <이 저장소>/`

| 주소 | 무엇 |
|---|---|
| `/` | 회사 소개 |
| `/check/` | 웹 1분 복용 점검 — 앱과 같은 `quick_check_v1` 로 판정. 카카오 공유 링크는 `/check/#invite=1` (받는 사람용 큰 글씨·존댓말) |
| `/check/senior/` | 같은 페이지의 약국 QR판 |
| `/app/` | 앱 받기 (출시 전엔 「출시 준비 중」, 스토어 주소는 원본 `앱받기.html`의 `STORE`) |
| `/privacy/` `/terms/` `/delete/` | 개인정보처리방침 · 이용약관 · 데이터 삭제 요청 |
| `/kakao-callback.html` | 앱 카카오 로그인 중계 페이지(사본). 지금 앱은 옛 `modubokyak.vercel.app` 의 것을 쓴다 — `modubokyak-com/app` 의 `landing/` 참고 |
| `/privacy.html` `/delete-account.html` | 옛 주소 → `/privacy/` `/delete/` 로 영구 이동 (`vercel.json`) |

`/check/` 에는 Supabase publishable 키가 들어갑니다(앱 `care-app/app.json` 과 같은 값). 잠그기(`migrate-auth-2-lockdown.sql`)는
`quick_check_v1` 의 anon 실행 권한을 남기므로, 잠근 뒤에도 웹 점검은 그대로 동작합니다.

**Vercel**: 팀 Modubokyak · 프로젝트 `modubokyak` · Root Directory `.`(저장소 루트) · Framework Preset `Other` · Build Command 없음.
도메인 `modubokyak.com`·`www.modubokyak.com` — DNS 는 가비아(A `@` 216.150.1.1·216.150.16.1, CNAME `www`).
