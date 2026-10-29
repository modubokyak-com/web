/* 웹 이용 통계 — 방문·단계 기록을 회사 서버(Supabase public.web_events)에 남긴다.
   테이블·권한·90일 자동 삭제: modubokyak-com/app 의 care-app/supabase/migrate-web-events.sql
   조회: 같은 폴더의 web-events-funnel.sql (Supabase SQL Editor)

   서버로 보내는 것 (개인정보처리방침 제2조 7항과 같은 목록)
     · 브라우저 번호 — 처음 방문할 때 만든 무작위 값. 90일이 지나면 새로 만든다.
     · 방문 번호 — 30분 넘게 아무 동작이 없거나, 카카오 초대·약국 QR·다른 사이트로 다시 들어오면 새로.
     · 페이지(home·check·app), 단계 이름, 본인/부모님 점검, 들어온 길(direct·invite·pharmacy),
       다른 사이트에서 왔으면 그 도메인(예: search.naver.com). 시각은 서버가 붙인다.
   보내지 않는 것: 고른 약·영양제 이름, 연령대, 건강 상태, 점검 결과, 주소 전체·검색어. IP 주소는 테이블에 넣지 않는다.
   브라우저 저장소(localStorage)에 두는 것:
     · 'mb_visitor' = { id: 브라우저 번호, born: 만든 시각 }
     · 'mb_visit'   = { id: 방문 번호, entry: 들어온 길, ref: 거쳐 온 사이트 도메인, last: 마지막으로 보낸 시각 }
     · 'mb_optout'  = '1' — 방침 페이지의 「이 브라우저에서 이용 통계 끄기」(privacy/index.html)

   보내지 않는 경우: 추적 거부(Do Not Track·GPC) · mb_optout · 위 세 페이지가 아닐 때. 이때는 저장소에도 쓰지 않는다.
   저장소를 쓸 수 없는 브라우저(사생활 보호 모드 등)는 페이지를 열 때마다 새 번호를 쓴다 — 기록은 남지만 같은 사람으로 묶이지 않는다.

   쓰는 법: window.mbStats('check_report', 'self') — 항상 Promise 를 돌려주고 절대 던지지 않는다. 그 Promise 는 지금 날아가는
   통계 요청이 모두 끝나면 풀린다(/app/ 의 스토어 이동이 view·store 둘 다 기다리게).
   이 파일보다 먼저 불린 것은 window.mbq 에 [event, flow] 로 쌓아 두면 여기서 보낸다(점검 페이지는 defer 로 부른다).
   통계가 화면을 막으면 안 된다: 실패는 조용히 버리고, 기다리는 곳은 /app/ 의 스토어 이동(최대 0.8초) 하나뿐이다. */
(function () {
  'use strict';

  var ENDPOINT = 'https://atzosfqrzsfrveympcfj.supabase.co/rest/v1/web_events';
  var KEY = 'sb_publishable_IxiFvJXOgllELr1E69-u-Q_34H6Oz8a';      // check/ 의 SUPABASE_PUBLISHABLE_KEY 와 같은 값
  var VISITOR_DAYS = 90;
  var IDLE_MS = 30 * 60 * 1000;
  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  var queued = Array.isArray(window.mbq) ? window.mbq : [];
  window.mbq = [];                                                  // 보내지 않는 경우에도 쌓인 것은 버린다
  var off = function () { return Promise.resolve(); };
  window.mbStats = off;

  /* localStorage 는 꺼 둔 브라우저에서 읽기만 해도 던진다 */
  var store = null;
  try { store = window.localStorage; } catch (e) { store = null; }

  try {
    if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    if (store && store.getItem('mb_optout') === '1') return;
    if (!window.fetch || !window.crypto || !window.crypto.getRandomValues) return;
  } catch (e) { return; }

  /* Vercel 은 /check 처럼 끝의 / 없이도 같은 페이지를 줄 수 있다 */
  var path = location.pathname;
  var page = (path === '/' || path === '/index.html') ? 'home'
    : /^\/check(\/|$)/.test(path) ? 'check'
    : /^\/app(\/|$)/.test(path) ? 'app'
    : null;
  if (!page) return;

  function uuid() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    var b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = '';
    for (var i = 0; i < 16; i++) h += (b[i] + 0x100).toString(16).slice(1);
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  function load(key) {
    try { var v = store && JSON.parse(store.getItem(key) || 'null'); return v && typeof v === 'object' ? v : null; }
    catch (e) { return null; }
  }
  function save(key, value) {
    try { if (store) store.setItem(key, JSON.stringify(value)); } catch (e) { /* 저장소가 막혀도 이번 페이지에서는 메모리 값으로 센다 */ }
  }

  /* 이번 페이지가 어떤 길로 열렸나. 약국 QR판은 빌드가 <html data-entry="pharmacy"> 를 붙인다(check/senior/) */
  function entryNow() {
    if (document.documentElement.getAttribute('data-entry') === 'pharmacy') return 'pharmacy';
    if (/(^|[#&])invite=1(&|$)/.test(location.hash)) return 'invite';
    return 'direct';
  }
  /* 다른 사이트에서 왔을 때 그 도메인만. 같은 사이트 안에서 넘어온 것은 null */
  function refNow() {
    try {
      if (!document.referrer) return null;
      var h = new URL(document.referrer).hostname.toLowerCase();
      if (!h || h === location.hostname.toLowerCase()) return null;
      return /^[a-z0-9.-]{1,100}$/.test(h) ? h : null;      // 서버 check 제약과 같다 — 어긋나면 행 전체가 거절된다
    } catch (e) { return null; }
  }
  function idle(v, t) { return !(t - v.last < IDLE_MS) || v.last > t; }

  var now = Date.now();
  var visitor = load('mb_visitor');
  if (!visitor || !UUID_RE.test(String(visitor.id)) || !(now - visitor.born < VISITOR_DAYS * 864e5) || visitor.born > now) {
    visitor = { id: uuid(), born: now };
    save('mb_visitor', visitor);
  }

  var entry = entryNow();
  var ref = refNow();
  var visit = load('mb_visit');
  var fresh = !visit || !UUID_RE.test(String(visit.id)) || idle(visit, now) ||
    (entry !== 'direct' && entry !== visit.entry) ||      // 카카오 초대·약국 QR로 새로 들어왔다
    (ref !== null && ref !== visit.ref);                   // 다른 사이트에서 새로 들어왔다
  if (fresh) visit = { id: uuid(), entry: entry, ref: ref, last: now };

  /* keepalive: 보낸 직후 페이지를 떠나도(링크 클릭·스토어 이동) 요청이 끝까지 간다.
     예전 브라우저 일부는 keepalive 와 CORS 사전 요청을 함께 못 해 바로 거절한다 — 그때는 keepalive 없이 한 번 더 보낸다. */
  var inflight = [];
  function post(row) {
    var body = JSON.stringify(row);
    function opts(keep) {
      return {
        method: 'POST', keepalive: keep, body: body,
        headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }
      };
    }
    var p = fetch(ENDPOINT, opts(true))
      .catch(function () { return fetch(ENDPOINT, opts(false)); })
      .then(function () { /* 결과는 보지 않는다 */ }, function () { /* 연결 실패도 조용히 */ });
    inflight.push(p);
    p.then(function () { var i = inflight.indexOf(p); if (i >= 0) inflight.splice(i, 1); });
  }

  function send(event, flow) {
    var t = Date.now();
    /* 탭을 열어 둔 채 30분 넘게 쉬었다가 누른 것도 새 방문이다 — 같은 페이지라 들어온 길은 다시 보고, 거쳐 온 사이트는 없다 */
    if (idle(visit, t)) visit = { id: uuid(), entry: entryNow(), ref: null, last: t };
    visit.last = t;
    save('mb_visit', visit);
    post({
      visitor_id: visitor.id, visit_id: visit.id, page: page, event: event,
      flow: flow === 'self' || flow === 'parent' ? flow : null,
      entry: visit.entry, ref_host: visit.ref || null
    });
  }

  window.mbStats = function (event, flow) {
    try { send(event, flow); return Promise.all(inflight.slice()).then(function () {}); }
    catch (e) { return Promise.resolve(); }
  };
  window.mbStats('view');
  for (var i = 0; i < queued.length; i++) {
    if (queued[i] && typeof queued[i][0] === 'string') window.mbStats(queued[i][0], queued[i][1]);
  }
})();
