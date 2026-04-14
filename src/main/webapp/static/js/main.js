// ── App 네임스페이스 + SPA 네비게이션 ──────────────────────────────
(function () {
    var meta = document.querySelector('meta[name="ctx"]');
    if (!meta) return;
    var CTX = meta.content;

    /* ── 페이지별 스크립트·초기화 함수 등록 ── */
    var PAGE_SCRIPTS = {};
    PAGE_SCRIPTS[CTX + '/facility.do'] = CTX + '/static/js/facility-manage.js';

    var PAGE_INITS = {};
    PAGE_INITS[CTX + '/main.do']     = function() { if(window.App && App.initDashboard) App.initDashboard(); };
    PAGE_INITS[CTX + '/facility.do'] = function() { if(window.FacilityManage) FacilityManage.init(); };

    /* ── 공통 fetch 래퍼 ── */
    window.App = {
        ctx: CTX,

        fetch: function (url, options) {
            var opts      = options || {};
            opts.headers  = Object.assign({ 'X-Fetch-Request': 'true' }, opts.headers || {});
            opts.credentials = opts.credentials || 'same-origin';

            return fetch(url, opts).then(function (res) {
                if (res.status === 401) {
                    alert('세션이 만료되었습니다. 로그인 페이지로 이동합니다.');
                    window.location.href = CTX + '/index.jsp?reason=expired';
                    return Promise.reject(new Error('session_expired'));
                }
                if (res.status === 403) {
                    return Promise.reject(new Error('forbidden'));
                }
                return res;
            });
        },

        /* ── 스크립트 동적 로드 (중복 방지) ── */
        loadScript: function (src) {
            return new Promise(function (resolve, reject) {
                if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
                var s   = document.createElement('script');
                s.src   = src;
                s.onload  = resolve;
                s.onerror = reject;
                document.body.appendChild(s);
            });
        },

        /* ── 사이드바 active 동기화 ── */
        updateSidebar: function (url) {
            try {
                var urlPath = new URL(url, window.location.origin).pathname;
                document.querySelectorAll('.sidebar .menu-item[href]').forEach(function (item) {
                    var itemHref = item.getAttribute('href');
                    if (!itemHref || itemHref === '#') return;
                    var itemPath = new URL(itemHref, window.location.origin).pathname;
                    item.classList.toggle('active', itemPath === urlPath);
                });
            } catch(e) {}
        },

        /* ── 콘텐츠 영역 교체 ── */
        loadContent: function (url, pushState) {
            var contentEl = document.querySelector('.content');
            if (!contentEl) return;
            
            // URL 정규화
            var path = new URL(url, window.location.origin).pathname;

            contentEl.style.opacity       = '0.5';
            contentEl.style.pointerEvents = 'none';

            // 중요: 시설 관리 데이터 초기화 (이전 페이지 데이터가 남아서 권한 오류 생기는 것 방지)
            if (path !== CTX + '/facility.do') {
                window.__FACILITY_DATA__ = null;
            }

            App.fetch(url)
                .then(function (res) { return res.text(); })
                .then(function (html) {
                    contentEl.innerHTML           = html;
                    contentEl.style.opacity       = '1';
                    contentEl.style.pointerEvents = '';
                    contentEl.scrollTop           = 0;

                    App.updateSidebar(url);

                    if (pushState !== false) {
                        history.pushState({ url: url }, document.title, url);
                    }

                    var scriptSrc = PAGE_SCRIPTS[path];
                    var initFn    = PAGE_INITS[path];

                    if (scriptSrc) {
                        App.loadScript(scriptSrc).then(function () {
                            if (initFn) initFn();
                        });
                    } else if (initFn) {
                        initFn();
                    }
                })
                .catch(function (err) {
                    console.error('SPA Load Error:', err);
                    if (err.message !== 'session_expired') {
                        contentEl.style.opacity       = '1';
                        contentEl.style.pointerEvents = '';
                    }
                });
        },

        navigate: function (url) { App.loadContent(url); }
    };

    /* ── 사이드바 클릭 → SPA 이동 ── */
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.menu-item[data-spa]').forEach(function (item) {
            item.addEventListener('click', function (e) {
                var href = item.getAttribute('href');
                if (!href || href === '#') return;
                
                e.preventDefault();
                App.loadContent(href);
            });
        });

        window.addEventListener('popstate', function (e) {
            if (e.state && e.state.url) App.loadContent(e.state.url, false);
        });

        history.replaceState({ url: window.location.href }, document.title, window.location.href);
    });
})();


// ── 세션 유효성 폴링 (30초마다 체크) ──────────────────────────────
(function () {
    var meta     = document.querySelector('meta[name="ctx"]');
    if (!meta) return;
    var ctx      = meta.content;
    var CHECK    = ctx + '/session-check.do';
    var LOGIN    = ctx + '/index.jsp?reason=kicked';

    function checkSession() {
        fetch(CHECK, { method: 'GET', credentials: 'same-origin' })
            .then(function (res) {
                if (res.status === 401) {
                    clearInterval(poller);
                    alert('다른 기기에서 로그인하여 현재 세션이 종료되었습니다.\n로그인 페이지로 이동합니다.');
                    window.location.href = LOGIN;
                }
            })
            .catch(function () {});
    }

    var poller = setInterval(checkSession, 30000);
})();


// ── 대시보드 렌더링 로직 (App.initDashboard로 캡슐화) ────────────────
document.addEventListener('DOMContentLoaded', function () {
    
    window.App.initDashboard = function() {
        function pad(n) { return n < 10 ? '0' + n : '' + n; }

        var isMiddleAdminMeta = document.querySelector('meta[name="isMiddleAdmin"]');
        var isMiddleAdmin     = isMiddleAdminMeta && isMiddleAdminMeta.content === 'true';

        var periods = [
            { name: '1교시', start: '09:00', end: '09:50', type: 'class' },
            { name: '2교시', start: '09:50', end: '10:40', type: 'class' },
            { name: '3교시', start: '10:40', end: '11:30', type: 'class' },
            { name: '4교시', start: '11:30', end: '12:20', type: 'class' },
            { name: '점심',  start: '12:20', end: '13:10', type: 'lunch' },
            { name: '5교시', start: '13:10', end: '14:00', type: 'class' },
            { name: '6교시', start: '14:00', end: '14:50', type: 'class' },
        ];

        var alarms = [
            { type: 'START',  message: '대강당 예약이 내일 1교시에 시작됩니다.',   date: '04.14', isRead: false },
            { type: 'RETURN', message: '노트북 반납 기한이 오늘 5교시입니다.',      date: '04.14', isRead: false },
            { type: 'START',  message: '회의실 A 예약이 승인되었습니다.',           date: '04.13', isRead: true  },
            { type: 'RETURN', message: '빔프로젝터 반납이 완료 처리되었습니다.',    date: '04.12', isRead: true  },
        ];

        var myReservations = [
            { target:'대강당',     type:'FACILITY',  date:'2026-04-15', period:'1교시', startTime:'09:00', purpose:'특강',       status:'승인' },
            { target:'노트북',     type:'EQUIPMENT', date:'2026-04-15', period:'3교시', startTime:'10:40', purpose:'실습 수업',   status:'대기' },
            { target:'회의실 A',   type:'FACILITY',  date:'2026-04-16', period:'2교시', startTime:'09:50', purpose:'교직원 회의', status:'승인' }
        ];

        var pendingRequests = [
            { requester:'유공일',   target:'대강당',     type:'FACILITY',  date:'2026-04-15', period:'2교시', startTime:'09:50', requestedAt:'2026-04-14' },
            { requester:'유공이',   target:'노트북',     type:'EQUIPMENT', date:'2026-04-15', period:'4교시', startTime:'11:30', requestedAt:'2026-04-14' }
        ];

        function typeBadge(type) { return type === 'FACILITY' ? '<span class="type-badge facility">시설</span>' : '<span class="type-badge equipment">비품</span>'; }
        function statusBadge(status) {
            var cls = { '대기':'waiting', '승인':'approved', '거절':'rejected', '취소':'cancelled' }[status] || '';
            return '<span class="status-badge ' + cls + '">' + status + '</span>';
        }

        function renderStats() {
            var pending = myReservations.filter(function(r){return r.status==='대기';}).length;
            var unread  = alarms.filter(function(a){return !a.isRead;}).length;
            if(document.getElementById('statWeekCount')) document.getElementById('statWeekCount').textContent = myReservations.length;
            if(document.getElementById('statPendingCount')) document.getElementById('statPendingCount').textContent = pending;
            if(document.getElementById('statApprovedCount')) document.getElementById('statApprovedCount').textContent = myReservations.length - pending;
            if(document.getElementById('statAlarmCount')) document.getElementById('statAlarmCount').textContent = unread;
        }

        function renderTables() {
            var myBody = document.getElementById('myReservationBody');
            if (myBody) {
                myBody.innerHTML = myReservations.map(function(r) {
                    return '<tr><td>' + typeBadge(r.type) + '</td><td class="td-name">' + r.target + '</td><td>' + r.date + '</td><td>' + r.period + '</td><td class="td-purpose">' + r.purpose + '</td><td>' + statusBadge(r.status) + '</td></tr>';
                }).join('');
            }
            var pendingBody = document.getElementById('pendingRequestBody');
            if (pendingBody && isMiddleAdmin) {
                pendingBody.innerHTML = pendingRequests.map(function(r) {
                    return '<tr><td class="td-name">' + r.requester + '</td><td>' + typeBadge(r.type) + '</td><td class="td-name">' + r.target + '</td><td>' + r.date + '</td><td>' + r.period + '</td><td>' + r.requestedAt + '</td></tr>';
                }).join('');
            }
        }

        function renderPeriodSchedule() {
            var el = document.getElementById('periodList');
            if (!el) return;
            var now = new Date();
            var hhmm = pad(now.getHours()) + ':' + pad(now.getMinutes());
            el.innerHTML = periods.map(function (p) {
                var status = hhmm >= p.end ? 'past' : hhmm >= p.start ? 'current' : 'future';
                return '<div class="period-item ' + status + '">' + '<span class="period-name">' + p.name + '</span>' + '<span class="period-time">' + p.start + '~' + p.end + '</span>' + (status==='current'?'<span class="period-now-badge">진행중</span>':'') + '</div>';
            }).join('');
        }

        function renderAlarms() {
            var el = document.getElementById('alarmList');
            if (!el) return;
            el.innerHTML = alarms.map(function(a) {
                return '<div class="alarm-item' + (a.isRead?'':' unread') + '">' + '<span class="alarm-type ' + (a.type==='START'?'start':'return') + '">' + (a.type==='START'?'시작':'반납') + '</span>' + '<div class="alarm-body"><div class="alarm-msg">' + a.message + '</div><div class="alarm-meta">' + a.date + '</div></div>' + '</div>';
            }).join('');
        }

        renderStats();
        renderTables();
        renderPeriodSchedule();
        renderAlarms();
    };

    // 초기 로드 시 실행
    App.initDashboard();
});


// ── 시계 (공통) ───────────────────────────────────────
(function () {
    var DAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function updateClock() {
        var now = new Date();
        if (document.getElementById('clockDay'))  document.getElementById('clockDay').textContent  = DAYS[now.getDay()];
        if (document.getElementById('clockDate')) document.getElementById('clockDate').textContent = now.getFullYear() + '. ' + pad(now.getMonth() + 1) + '. ' + pad(now.getDate()) + '.';
        if (document.getElementById('clockTime')) document.getElementById('clockTime').textContent = pad(now.getHours()) + ' : ' + pad(now.getMinutes());
        setTimeout(updateClock, 10000);
    }
    updateClock();
})();
