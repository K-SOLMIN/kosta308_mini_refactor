// ── App 네임스페이스 + SPA 네비게이션 ──────────────────────────────
(function () {
    var meta = document.querySelector('meta[name="ctx"]');
    if (!meta) return;
    var CTX = meta.content;

    /* ── 페이지별 스크립트·초기화 함수 등록 ── */
    var PAGE_SCRIPTS = {};
    PAGE_SCRIPTS[CTX + '/facility.do'] = CTX + '/static/js/facility-manage.js';

    var PAGE_INITS = {};
    PAGE_INITS[CTX + '/facility.do'] = function () {
        if (window.FacilityManage) FacilityManage.init();
    };

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
            var urlPath = url.split('?')[0];
            document.querySelectorAll('.menu-item[href]').forEach(function (item) {
                var href = (item.getAttribute('href') || '').split('?')[0];
                item.classList.toggle('active', href === urlPath);
            });
        },

        /* ── 콘텐츠 영역 교체 ── */
        loadContent: function (url, pushState) {
            var contentEl = document.querySelector('.content');
            if (!contentEl) return;
            contentEl.style.opacity       = '0.5';
            contentEl.style.pointerEvents = 'none';

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

                    var scriptSrc = PAGE_SCRIPTS[url];
                    var initFn    = PAGE_INITS[url];

                    if (scriptSrc) {
                        App.loadScript(scriptSrc).then(function () {
                            if (initFn) initFn();
                        });
                    } else if (initFn) {
                        initFn();
                    }
                })
                .catch(function (err) {
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

        /* ── 브라우저 뒤로/앞으로 ── */
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


// ── 대시보드 렌더링 ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    /* ── Meta 값 읽기 ── */
    var isMiddleAdminMeta = document.querySelector('meta[name="isMiddleAdmin"]');
    var isMiddleAdmin     = isMiddleAdminMeta && isMiddleAdminMeta.content === 'true';

    /* ── Mock 교시 정의 ── */
    var periods = [
        { name: '1교시', start: '09:00', end: '09:50', type: 'class' },
        { name: '2교시', start: '09:50', end: '10:40', type: 'class' },
        { name: '3교시', start: '10:40', end: '11:30', type: 'class' },
        { name: '4교시', start: '11:30', end: '12:20', type: 'class' },
        { name: '점심',  start: '12:20', end: '13:10', type: 'lunch' },
        { name: '5교시', start: '13:10', end: '14:00', type: 'class' },
        { name: '6교시', start: '14:00', end: '14:50', type: 'class' },
    ];

    /* ── Mock 알림 ── */
    var alarms = [
        { type: 'START',  message: '대강당 예약이 내일 1교시에 시작됩니다.',   date: '04.14', isRead: false },
        { type: 'RETURN', message: '노트북 반납 기한이 오늘 5교시입니다.',      date: '04.14', isRead: false },
        { type: 'START',  message: '회의실 A 예약이 승인되었습니다.',           date: '04.13', isRead: true  },
        { type: 'RETURN', message: '빔프로젝터 반납이 완료 처리되었습니다.',    date: '04.12', isRead: true  },
    ];

    /* ── Mock 데이터 ── */
    var myReservations = [
        { target:'대강당',     type:'FACILITY',  date:'2026-04-15', period:'1교시', startTime:'09:00', purpose:'특강',       status:'승인' },
        { target:'노트북',     type:'EQUIPMENT', date:'2026-04-15', period:'3교시', startTime:'10:40', purpose:'실습 수업',   status:'대기' },
        { target:'회의실 A',   type:'FACILITY',  date:'2026-04-16', period:'2교시', startTime:'09:50', purpose:'교직원 회의', status:'승인' },
        { target:'빔프로젝터', type:'EQUIPMENT', date:'2026-04-16', period:'5교시', startTime:'13:00', purpose:'발표 수업',   status:'대기' },
        { target:'컴퓨터실 1', type:'FACILITY',  date:'2026-04-17', period:'4교시', startTime:'11:30', purpose:'코딩 교육',   status:'승인' },
        { target:'세미나실',   type:'FACILITY',  date:'2026-04-18', period:'6교시', startTime:'13:50', purpose:'소그룹 활동', status:'거절' },
        { target:'확성기',     type:'EQUIPMENT', date:'2026-04-21', period:'점심',  startTime:'12:20', purpose:'행사 진행',   status:'취소' }
    ];

    var pendingRequests = [
        { requester:'유공일',   target:'대강당',     type:'FACILITY',  date:'2026-04-15', period:'2교시', startTime:'09:50', requestedAt:'2026-04-14' },
        { requester:'유공이',   target:'노트북',     type:'EQUIPMENT', date:'2026-04-15', period:'4교시', startTime:'11:30', requestedAt:'2026-04-14' },
        { requester:'유공삼',   target:'회의실 A',   type:'FACILITY',  date:'2026-04-16', period:'1교시', startTime:'09:00', requestedAt:'2026-04-13' },
        { requester:'취소유저', target:'빔프로젝터', type:'EQUIPMENT', date:'2026-04-17', period:'3교시', startTime:'10:40', requestedAt:'2026-04-13' },
        { requester:'유공일',   target:'컴퓨터실 1', type:'FACILITY',  date:'2026-04-18', period:'5교시', startTime:'13:00', requestedAt:'2026-04-14' },
        { requester:'유공이',   target:'세미나실',   type:'FACILITY',  date:'2026-04-21', period:'2교시', startTime:'09:50', requestedAt:'2026-04-14' }
    ];

    /* ── 유틸 ── */
    function sortByDateTime(arr) {
        return arr.slice().sort(function (a, b) {
            var ka = a.date + ' ' + a.startTime;
            var kb = b.date + ' ' + b.startTime;
            return ka < kb ? -1 : ka > kb ? 1 : 0;
        });
    }

    function typeBadge(type) {
        return type === 'FACILITY'
            ? '<span class="type-badge facility">시설</span>'
            : '<span class="type-badge equipment">비품</span>';
    }

    function statusBadge(status) {
        var cls = { '대기':'waiting', '승인':'approved', '거절':'rejected', '취소':'cancelled', '반납완료':'returned' }[status] || '';
        return '<span class="status-badge ' + cls + '">' + status + '</span>';
    }

    /* ── 나의 예약 내역 ── */
    var myBody = document.getElementById('myReservationBody');
    if (myBody) {
        var sorted = sortByDateTime(myReservations).slice(0, 7);
        myBody.innerHTML = sorted.length === 0
            ? '<tr><td colspan="6" class="dash-empty">예약 내역이 없습니다.</td></tr>'
            : sorted.map(function (r) {
                return '<tr>'
                    + '<td>' + typeBadge(r.type) + '</td>'
                    + '<td class="td-name">' + r.target + '</td>'
                    + '<td>' + r.date + '</td>'
                    + '<td>' + r.period + ' <span class="td-time">(' + r.startTime + ')</span></td>'
                    + '<td class="td-purpose">' + r.purpose + '</td>'
                    + '<td>' + statusBadge(r.status) + '</td>'
                    + '</tr>';
            }).join('');
    }

    /* ── 예약 요청 목록 (관리자) ── */
    var pendingBody = document.getElementById('pendingRequestBody');
    if (pendingBody && isMiddleAdmin) {
        var sortedP = sortByDateTime(pendingRequests).slice(0, 7);
        pendingBody.innerHTML = sortedP.length === 0
            ? '<tr><td colspan="6" class="dash-empty">대기 중인 요청이 없습니다.</td></tr>'
            : sortedP.map(function (r) {
                return '<tr>'
                    + '<td class="td-name">' + r.requester + '</td>'
                    + '<td>' + typeBadge(r.type) + '</td>'
                    + '<td class="td-name">' + r.target + '</td>'
                    + '<td>' + r.date + '</td>'
                    + '<td>' + r.period + ' <span class="td-time">(' + r.startTime + ')</span></td>'
                    + '<td>' + r.requestedAt + '</td>'
                    + '</tr>';
            }).join('');
    }

    /* ── 요약 통계 렌더링 ── */
    function renderStats() {
        var pending  = myReservations.filter(function (r) { return r.status === '대기'; }).length;
        var approved = myReservations.filter(function (r) { return r.status === '승인'; }).length;
        var unread   = alarms.filter(function (a) { return !a.isRead; }).length;

        var weekEl  = document.getElementById('statWeekCount');
        var pendEl  = document.getElementById('statPendingCount');
        var apprEl  = document.getElementById('statApprovedCount');
        var almEl   = document.getElementById('statAlarmCount');

        if (weekEl) weekEl.textContent  = myReservations.length;
        if (pendEl) pendEl.textContent  = pending;
        if (apprEl) apprEl.textContent  = approved;
        if (almEl)  almEl.textContent   = unread;
    }

    /* ── 교시 현황 렌더링 ── */
    function renderPeriodSchedule() {
        var el = document.getElementById('periodList');
        if (!el) return;

        var now  = new Date();
        var hhmm = pad(now.getHours()) + ':' + pad(now.getMinutes());

        el.innerHTML = periods.map(function (p) {
            var status = hhmm >= p.end   ? 'past'
                       : hhmm >= p.start ? 'current'
                       : 'future';
            var cls = 'period-item ' + status + (p.type === 'lunch' ? ' lunch' : '');
            var badge = status === 'current'
                ? '<span class="period-now-badge">진행중</span>'
                : '';
            return '<div class="' + cls + '">'
                + '<span class="period-name">' + p.name + '</span>'
                + '<span class="period-time">' + p.start + '~' + p.end + '</span>'
                + badge
                + '</div>';
        }).join('');
    }

    /* ── 알림 렌더링 ── */
    function renderAlarms() {
        var el = document.getElementById('alarmList');
        if (!el) return;

        if (alarms.length === 0) {
            el.innerHTML = '<div style="padding:16px;font-size:13px;color:#aab8c4;text-align:center;">알림이 없습니다.</div>';
            return;
        }

        el.innerHTML = alarms.slice(0, 4).map(function (a) {
            var typeCls   = a.type === 'START' ? 'start' : 'return';
            var typeLabel = a.type === 'START' ? '시작' : '반납';
            var itemCls   = 'alarm-item' + (a.isRead ? '' : ' unread');
            return '<div class="' + itemCls + '">'
                + '<span class="alarm-type ' + typeCls + '">' + typeLabel + '</span>'
                + '<div class="alarm-body">'
                +   '<div class="alarm-msg">' + a.message + '</div>'
                +   '<div class="alarm-meta">' + a.date + '</div>'
                + '</div>'
                + (!a.isRead ? '<div class="alarm-dot"></div>' : '')
                + '</div>';
        }).join('');
    }

    renderStats();
    renderPeriodSchedule();
    renderAlarms();
    setInterval(renderPeriodSchedule, 60000);

    /* ── 사이드바 active 처리 ── */
    var currentPath = window.location.pathname;
    document.querySelectorAll('.menu-item').forEach(function (item) {
        var href = item.getAttribute('href');
        if (href && href !== '#' && currentPath.endsWith(href.split('/').pop())) {
            item.classList.add('active');
        }
    });
});


// ── 시계 (분 단위 업데이트) ───────────────────────────────────────
(function () {
    var DAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function updateClock() {
        var now    = new Date();
        var dayEl  = document.getElementById('clockDay');
        var dateEl = document.getElementById('clockDate');
        var timeEl = document.getElementById('clockTime');

        if (dayEl)  dayEl.textContent  = DAYS[now.getDay()];
        if (dateEl) dateEl.textContent = now.getFullYear() + '. ' + pad(now.getMonth() + 1) + '. ' + pad(now.getDate()) + '.';
        if (timeEl) timeEl.textContent = pad(now.getHours()) + ' : ' + pad(now.getMinutes());

        // 다음 분 정각에 맞춰 재귀 호출
        var msLeft = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
        setTimeout(updateClock, msLeft);
    }

    updateClock();
})();
