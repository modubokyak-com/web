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
| `/privacy/2026-10-15/` | 이전 방침(2026-10-15 ~ 2026-10-28 적용) 보관본 — 원본 `개인정보처리방침-2026-10-15.html` |
| `/privacy/2026-10-29/` | 이전 방침(2026-10-29 적용) 보관본 — 원본 `개인정보처리방침-2026-10-29.html` |
| `/stats.js` | 웹 이용 통계 — 아래 「이용 통계」. 원본 `소스/stats.js`(빌드가 공개키 두 자리를 채운다) |
| `/kakao-callback.html` | 앱 카카오 로그인 중계 페이지(사본). 지금 앱은 옛 `modubokyak.vercel.app` 의 것을 쓴다 — `modubokyak-com/app` 의 `landing/` 참고 |
| `/privacy.html` `/delete-account.html` | 옛 주소 → `/privacy/` `/delete/` 로 영구 이동 (`vercel.json`) |

`/check/` 에는 Supabase publishable 키가 들어갑니다(앱 `care-app/app.json` 과 같은 값). 잠그기(`migrate-auth-2-lockdown.sql`)는
`quick_check_v1` 의 anon 실행 권한을 남기므로, 잠근 뒤에도 웹 점검은 그대로 동작합니다.

**Vercel**: 팀 Modubokyak · 프로젝트 `modubokyak` · Root Directory `.`(저장소 루트) · Framework Preset `Other` · Build Command 없음.
도메인 `modubokyak.com`·`www.modubokyak.com` — DNS 는 가비아(A `@` 216.150.1.1·216.150.16.1, CNAME `www`).

## 이용 통계 (2026-10-29 게시)

회사 소개 → 1분 점검 단계 → 앱 받기 → 스토어 이동까지의 퍼널을 Supabase `public.web_events` 에 남긴다.
같은 사람의 재방문은 브라우저 저장소의 무작위 번호(`mb_visitor`, 90일)로 묶는다. 쿠키·외부 분석 서비스는 쓰지 않는다.

- **보내는 곳**: `stats.js` 하나. `/`·`/check/`·`/check/senior/`·`/app/` 만 불러온다. 점검 페이지는 `stat()` 으로 화면 전환·버튼 몇 개를 보낸다.
  약 이름·연령대·건강 상태·결과는 싣지 않는다. 추적 거부(DNT·GPC) 브라우저는 보내지 않는다.
- **시작**: 배포하면 바로 모은다(방침 시행일 2026-10-29). 출시 전·가입자 없음이라 사전 고지 기간(방침 제13조) 없이 바로 시행하기로 했다(2026-10-25 결정).
  출시 뒤에 수집 항목을 늘릴 때는 제13조대로 30일 전부터 웹 방침과 앱 안 개인정보 설정 두 곳에 알린다.
- **테이블·권한·90일 삭제**: `modubokyak-com/app` 의 `care-app/supabase/migrate-web-events.sql` (SQL Editor 에서 한 번 실행).
- **보는 곳**: Supabase 대시보드 → SQL Editor 에 `care-app/supabase/web-events-funnel.sql` 을 붙여 넣는다(퍼널·들어온 길·날짜별·재방문·온 사이트).
  대시보드 도구를 붙일 때는 `stats.web_visitor_days` 뷰(한 줄 = 한 사람의 하루)를 읽기 전용 계정으로 연결한다 — 같은 SQL 파일의 주석 참고.
- **점검 페이지 CSP**: `script-src` 에 `'self'` 를 넣었다(`/stats.js`). `connect-src` 는 원래 Supabase 주소라 그대로다.

원본(iCloud)에 들어 있다(2026-10-28 옮김) — `소스/stats.js`, `common/` 의 복용분석·회사소개·앱받기·개인정보처리방침(+`-2026-10-15` 보관본)·계정삭제-요청,
빌드 스크립트 12·13번. 원본으로 빌드한 결과가 이 저장소와 같다.

## 앱 이용 통계 — 방침 제2조 8항 (2026-10-30 시행)

앱(`modubokyak-com/app`)이 로그인 전부터 화면·단계 기록을 Supabase `public.app_events` 에 남긴다. 무작위 설치 번호(90일마다 새로)로만 묶고 계정과 잇지 않는다.
테이블·조회는 앱 저장소 `care-app/supabase/migrate-app-events.sql`·`app-events-funnel.sql`. 앱에서 「더보기 → 개인정보 설정 → 앱 이용 통계 보내기」로 끈다.
이 방침은 통계가 들어간 앱 빌드보다 먼저 게시해도 된다(출시 전). 원본(iCloud)에는 이미 들어 있으므로, 이 변경을 합치기 전에 다른 웹 변경을 빌드·배포하면 이 방침도 함께 나간다.
게시일이 10-30 이 아니면 시행일을 그날로 바꾼다 — 원본 `개인정보처리방침.html`(머리·개정 안내·제1조 표·제4조·제14조)·`-2026-10-29.html` 보관본의 「까지/부터」·`.md` 사본, 앱 `privacyPolicy.ts`.
