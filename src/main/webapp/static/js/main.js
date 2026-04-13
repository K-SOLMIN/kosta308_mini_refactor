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

    /* ── Meta 값 읽기 ── */
    var isMiddleAdminMeta = document.querySelector('meta[name="isMiddleAdmin"]');
    var isMiddleAdmin     = isMiddleAdminMeta && isMiddleAdminMeta.content === 'true';

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
