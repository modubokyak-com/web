# 웹 이용 통계(전환 퍼널) — 검토·배포용 메모

브랜치 `claude/tender-newton-nzg92y` (cloud 세션, 2026-10-25~27). **병합하기 전에 이 파일은 지우세요** — `.vercelignore` 에 넣어 두어
사이트에는 올라가지 않지만, 원본(iCloud)과 맞추는 다음 `rsync --delete` 에서도 지워집니다.

짝이 되는 DB 변경은 `modubokyak-com/app` 의 같은 이름 브랜치에 있습니다(`care-app/supabase/migrate-web-events.sql` · `web-events-funnel.sql`).

## 무엇을 하나

회사 소개(`/`) → 1분 점검(`/check/`, `/check/senior/`) 단계 → 결과 → 앱 받기(`/app/`) → 스토어 이동까지를 **사람 단위 퍼널**로 셉니다.
같은 사람이 다시 들어온 것은 브라우저에 둔 무작위 번호로 구분합니다(중복 접속 구분).

| 이벤트 | 언제 |
|---|---|
| `view` | 위 세 페이지를 열 때 |
| `check_supp` · `check_rx` · `check_analyzing` · `check_report` | 점검 화면이 바뀔 때 (본인/부모님 구분 `flow`) |
| `check_failed` | 서버에 못 닿아 판정 실패 |
| `parent_start` · `share` | 결과 아래 「부모님 약 점검하기」·「가족·지인에게 1분 점검 보내기」 |
| `store_android` · `store_ios` | `/app/` 에서 스토어로 이동(지금은 `STORE` 가 비어 있어 일어나지 않음) |

행마다 함께 가는 값: 브라우저 번호, 방문 번호, 페이지, 들어온 길(`direct`·`invite`=#invite=1·`pharmacy`=/check/senior/),
다른 사이트에서 왔으면 **도메인만**(예: `search.naver.com`). 시각은 서버가 붙입니다.
**보내지 않는 것**: 고른 약·영양제 이름, 연령대, 건강 상태, 점검 결과, IP, 주소 전체·검색어.

## 측정 도구 — 외부 스크립트·키·쿠키

- **외부 분석 서비스 없음.** GA·Vercel Analytics·GTM 등 아무것도 붙이지 않았습니다. 자체 파일 `stats.js` 하나가
  Supabase REST(`POST https://atzosfqrzsfrveympcfj.supabase.co/rest/v1/web_events`)로 직접 보냅니다.
- **키**: 1분 점검이 이미 쓰는 **같은 publishable 키**(`sb_publishable_…`, `check/index.html` 0번 구역과 같은 값)를 `stats.js` 에 적었습니다.
  원본 빌드가 `소스/supabase-공개키.json` 에서 채우는 방식으로 바꿔도 됩니다. 새 비밀 키는 없습니다.
- **쿠키 없음.** 브라우저 저장소(localStorage)에 세 키를 씁니다:
  - `mb_visitor` = `{ id, born }` — 브라우저 번호(무작위 UUID), 90일 지나면 새로
  - `mb_visit` = `{ id, entry, ref, last }` — 방문 번호, 30분 무동작·다른 경로 진입이면 새로
  - `mb_optout` = `'1'` — 방침 페이지의 「이 브라우저에서 이용 통계 끄기」
- **보내지 않는 경우**: 브라우저의 Do Not Track·GPC, `mb_optout`. 저장소가 막힌 브라우저는 페이지마다 새 번호(같은 사람으로 안 묶임).
- **CSP**: 1분 점검 페이지(`check/`·`check/senior/`)의 `script-src` 에 `'self'` 를 더했습니다(`/stats.js`). `connect-src` 는 원래 Supabase 주소라 그대로.
- 점검 페이지는 `defer` 로 불러 첫 화면을 늦추지 않고, 그 전에 누른 단계는 `window.mbq` 에 쌓았다가 보냅니다. 요청은 `keepalive`.
  `/app/` 만 `defer` 없이 부르고, 스토어로 넘기기 전 기록을 **최대 0.8초** 기다립니다. `stats.js` 가 막혀도 모든 페이지가 그대로 동작합니다.

## 개인정보처리방침 — 이미 반영함, 한 가지 확인 필요

- `privacy/index.html` 을 새 방침으로 고쳤습니다: **제2조 7항 「웹사이트 이용 통계 (자동 수집 장치의 설치·운영과 거부)」** 신설,
  제2조 1항·5항, 제3조(목적), 제4조(90일 자동 삭제·계정과 연결되지 않는 기록), 제6조(쿠키·외부 분석 없음), 제7·8조(Supabase 행),
  제11조, 제14조, 머리의 개정 안내, 7항 아래 「이 브라우저에서 이용 통계 끄기」 버튼(작은 인라인 스크립트).
- 이전 방침은 `privacy/2026-10-15/index.html` 로 보관(`noindex`). `delete/index.html` 「지워지지 않는 것」에 한 줄.
- 출시 전·가입자 없음이라 **제13조의 사전 고지(30일) 없이 바로 시행**하기로 했습니다(사용자 결정 2026-10-25). 앱 안 방침은 바꾸지 않았습니다(앱 수집 항목 그대로).
- ⚠ **시행일이 2026-10-25 로 적혀 있습니다. 실제 게시일로 바꿔 주세요.** 바꿀 곳:
  `privacy/index.html` — 머리 `시행일`, 개정 안내 `(2026년 10월 25일)`, 제1조 표 `시행일`, 제4조 `웹사이트 이용 통계는 …부터 모읍니다`,
  제14조 두 줄(적용일·이전 방침 기간 `…10월 24일까지`) / `privacy/2026-10-15/index.html` 머리 두 날짜 / `README.md` 「이용 통계」.
- 방침 문구는 개발 쪽 초안입니다 — 법무 검토 대상.

## 배포 순서

1. **Supabase SQL Editor** 에서 app 브랜치의 `care-app/supabase/migrate-web-events.sql` 을 한 번 실행(두 번 돌려도 안전).
   테이블 `public.web_events`(anon 은 7개 컬럼 insert 만), 90일 자동 삭제(`purge_usage_stats()` 갱신, cron 그대로), 대시보드용 `stats.web_visitor_days` 뷰.
   SQL 없이 웹이 먼저 나가도 오류는 없고(요청이 404 로 조용히 버려짐) 기록만 안 쌓입니다.
2. 이 브랜치를 main 에 병합 → Vercel 배포. **병합 전에 이 파일 삭제.**
3. 배포 뒤: 사이트를 한 번 열고 `select * from public.web_events order by id desc limit 5;` 로 행이 들어오는지 확인.
   (cloud 세션에서는 프록시 때문에 실제 Supabase 로 보내 보지 못했습니다 — CORS 가 `Prefer` 헤더를 받는지가 남은 확인거리. supabase-js insert 와 같은 헤더라 될 것으로 봅니다.)
4. **원본(iCloud)에 옮기기** — `README.md` 「⚠ 원본(iCloud)에 옮길 것」 6개 항목.

## 결과 보는 곳

Supabase 대시보드 → SQL Editor 에 `care-app/supabase/web-events-funnel.sql`(기본 최근 30일): 단계별 퍼널(앞 단계를 모두 거친 사람),
들어온 길별, 날짜별, 재방문, 온 사이트. 대시보드 도구(예: Looker Studio)는 `stats.web_visitor_days` 를 읽기 전용 계정으로 — 같은 SQL 파일 주석.

## 검증

- 로컬 Postgres 16: 두 번 적용, anon 권한(insert 7개 컬럼만, select·update·delete·`created_at` 지정·`stats` 스키마·정리 함수 불가), 90일 삭제, 조회 5개.
- Playwright(Chromium, Supabase 가로채기) 39항목: 퍼널 순서, 같은 사람·같은 방문, 초대·약국·30분·90일, 추적 거부·GPC·끄기 버튼,
  저장소 차단, `stats.js` 404 에도 점검 정상, `/app/` 스토어 이동(느린 서버에서도 0.8초), `/check`(끝 `/` 없음), 늦게 온 `stats.js` 의 대기열.
- 별도 리뷰 1회(지적 반영). app 저장소 규칙의 Codex 교차 리뷰는 이 환경에 Codex 가 없어 하지 못했습니다.
