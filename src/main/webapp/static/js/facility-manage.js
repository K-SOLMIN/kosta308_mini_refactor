// ── 시설 관리 페이지 ──────────────────────────────────────────────
(function () {
    'use strict';

    /* ── 페이지 상태 ── */
    var state = {
        facilities:   [],
        managers:     [],
        filterStatus: 'all',
        searchText:   '',
        editingId:    null,
        isAdmin:      false
    };

    /* ══════════════════════════════════════════
       초기화
    ══════════════════════════════════════════ */
    function init() {
        var data = window.__FACILITY_DATA__ || {};
        state.isAdmin   = !!data.isAdmin;
        state.managers  = getMockManagers();

        // 서버 데이터가 있으면 사용, 없으면 Mock
        var serverList = data.facilities || [];
        state.facilities = serverList.length > 0 ? serverList : getMockFacilities();

        renderStats();
        renderTable();
        populateManagerSelect();
        setupListeners();
    }

    /* ══════════════════════════════════════════
       Mock 데이터 (DB 연동 전 개발용)
    ══════════════════════════════════════════ */
    function getMockFacilities() {
        return [
            { id:1, name:'대강당',     location:'본관 3층',  managerId:2, managerName:'김관리', capacity:200, maxValue:1, maxUnit:'주', status:'정상' },
            { id:2, name:'컴퓨터실 1', location:'별관 2층',  managerId:3, managerName:'이관리', capacity:30,  maxValue:3, maxUnit:'일', status:'정상' },
            { id:3, name:'컴퓨터실 2', location:'별관 2층',  managerId:3, managerName:'이관리', capacity:30,  maxValue:3, maxUnit:'일', status:'수리' },
            { id:4, name:'회의실 A',   location:'본관 2층',  managerId:4, managerName:'박관리', capacity:15,  maxValue:2, maxUnit:'일', status:'정상' },
            { id:5, name:'회의실 B',   location:'본관 2층',  managerId:4, managerName:'박관리', capacity:15,  maxValue:2, maxUnit:'일', status:'점검' },
            { id:6, name:'세미나실',   location:'본관 4층',  managerId:null, managerName:null,  capacity:50,  maxValue:1, maxUnit:'일', status:'정상' },
            { id:7, name:'체육관',     location:'운동장동',  managerId:5, managerName:'최관리', capacity:500, maxValue:1, maxUnit:'주', status:'정상' },
        ];
    }

    function getMockManagers() {
        return [
            { id:2, name:'김관리' },
            { id:3, name:'이관리' },
            { id:4, name:'박관리' },
            { id:5, name:'최관리' },
            { id:6, name:'수지' },
            { id:7, name:'솔민' },
            { id:8, name:'민중' },
        ];
    }

    /* ══════════════════════════════════════════
       통계 카드 렌더링
    ══════════════════════════════════════════ */
    function renderStats() {
        var all    = state.facilities;
        var total  = all.length;
        var normal = all.filter(function(f) { return f.status === '정상'; }).length;
        var issue  = all.filter(function(f) { return f.status === '수리' || f.status === '점검'; }).length;
        var noMgr  = all.filter(function(f) { return !f.managerId; }).length;

        setText('fmStatTotal',  total);
        setText('fmStatNormal', normal);
        setText('fmStatIssue',  issue);
        setText('fmStatNoMgr',  noMgr);
    }

    /* ══════════════════════════════════════════
       테이블 렌더링
    ══════════════════════════════════════════ */
    function renderTable() {
        var tbody = document.getElementById('fmTableBody');
        if (!tbody) return;

        var filtered = getFiltered();
        var colSpan  = state.isAdmin ? 8 : 7;

        // 결과 건수 표시
        setText('fmResultCount', filtered.length + '개 시설');

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="' + colSpan + '" class="dash-empty">조건에 맞는 시설이 없습니다.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function (f, i) {
            var managerCell = f.managerName
                ? '<span class="td-name">' + esc(f.managerName) + '</span>'
                : '<span class="fm-no-mgr">미배정</span>';

            var manageCell = state.isAdmin
                ? '<td class="fm-manage-cell">'
                    + '<button class="btn-tbl-edit" data-action="edit"   data-id="' + f.id + '">수정</button>'
                    + '<button class="btn-tbl-del"  data-action="delete" data-id="' + f.id + '">삭제</button>'
                  + '</td>'
                : '';

            return '<tr data-id="' + f.id + '" class="' + (!f.managerId ? 'tr-no-mgr' : '') + '">'
                + '<td class="col-idx">' + (i + 1) + '</td>'
                + '<td class="td-name">' + esc(f.name) + '</td>'
                + '<td>' + esc(f.location) + '</td>'
                + '<td>' + managerCell + '</td>'
                + '<td class="col-num">' + f.capacity + '명</td>'
                + '<td class="col-num">' + f.maxValue + f.maxUnit + '</td>'
                + '<td class="col-status">' + statusBadge(f.status) + '</td>'
                + manageCell
                + '</tr>';
        }).join('');
    }

    /* ── 필터 적용 ── */
    function getFiltered() {
        var kw = state.searchText.toLowerCase();
        return state.facilities.filter(function (f) {
            if (state.filterStatus !== 'all' && f.status !== state.filterStatus) return false;
            if (!kw) return true;
            return (f.name        || '').toLowerCase().indexOf(kw) >= 0
                || (f.location    || '').toLowerCase().indexOf(kw) >= 0
                || (f.managerName || '').toLowerCase().indexOf(kw) >= 0;
        });
    }

    /* ── 상태 뱃지 ── */
    function statusBadge(status) {
        var map = { '정상': 'approved', '수리': 'waiting', '점검': 'inspection' };
        return '<span class="status-badge ' + (map[status] || '') + '">' + esc(status) + '</span>';
    }

    /* ══════════════════════════════════════════
       담당자 Select 옵션 채우기
    ══════════════════════════════════════════ */
    function populateManagerSelect() {
        var sel = document.getElementById('fmManager');
        if (!sel) return;
        state.managers.forEach(function (m) {
            var opt = document.createElement('option');
            opt.value       = m.id;
            opt.textContent = m.name;
            sel.appendChild(opt);
        });
    }

    /* ══════════════════════════════════════════
       이벤트 바인딩
    ══════════════════════════════════════════ */
    function setupListeners() {
        // 필터 탭
        document.querySelectorAll('.fm-filter-tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.fm-filter-tab').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                state.filterStatus = btn.dataset.filter;
                renderTable();
            });
        });

        // 검색 입력
        var searchEl = document.getElementById('fmSearch');
        if (searchEl) {
            searchEl.addEventListener('input', function () {
                state.searchText = this.value;
                renderTable();
            });
        }

        // 시설 등록 버튼
        var addBtn = document.getElementById('btnAddFacility');
        if (addBtn) addBtn.addEventListener('click', function () { openModal(null); });

        // 모달 닫기
        bindClose('modalClose',  closeModal);
        bindClose('modalCancel', closeModal);
        var overlay = document.getElementById('facilityModal');
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) closeModal();
            });
        }

        // 모달 제출
        var submitBtn = document.getElementById('modalSubmit');
        if (submitBtn) submitBtn.addEventListener('click', handleSubmit);

        // 테이블 이벤트 위임
        var tbody = document.getElementById('fmTableBody');
        if (tbody) {
            tbody.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-action]');
                if (!btn) return;

                var action = btn.dataset.action;
                var id     = parseInt(btn.dataset.id || btn.closest('tr').dataset.id, 10);

                if (action === 'edit') {
                    var fac = state.facilities.find(function (f) { return f.id === id; });
                    if (fac) openModal(fac);

                } else if (action === 'delete') {
                    showInlineConfirm(id, btn.closest('tr'));

                } else if (action === 'confirm-delete') {
                    execDelete(id);

                } else if (action === 'cancel-delete') {
                    renderTable();
                }
            });
        }
    }

    function bindClose(id, fn) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    }

    /* ══════════════════════════════════════════
       모달
    ══════════════════════════════════════════ */
    function openModal(facility) {
        var modal     = document.getElementById('facilityModal');
        var titleEl   = document.getElementById('modalTitle');
        var submitBtn = document.getElementById('modalSubmit');
        if (!modal) return;

        // 폼 초기화
        setVal('fmFacilityId', '');
        setVal('fmName',       '');
        setVal('fmLocation',   '');
        setVal('fmManager',    '');
        setVal('fmCapacity',   '');
        setVal('fmMaxValue',   '');
        setVal('fmMaxUnit',    '일');
        setRadio('fmStatus', '정상');

        if (facility) {
            // 수정 모드
            titleEl.textContent   = '시설 수정';
            submitBtn.textContent = '수정';
            state.editingId       = facility.id;

            setVal('fmFacilityId', facility.id);
            setVal('fmName',       facility.name     || '');
            setVal('fmLocation',   facility.location || '');
            setVal('fmManager',    facility.managerId || '');
            setVal('fmCapacity',   facility.capacity);
            setVal('fmMaxValue',   facility.maxValue);
            setVal('fmMaxUnit',    facility.maxUnit  || '일');
            setRadio('fmStatus',   facility.status   || '정상');
        } else {
            // 등록 모드
            titleEl.textContent   = '시설 등록';
            submitBtn.textContent = '등록';
            state.editingId       = null;
        }

        modal.style.display = 'flex';
        var nameEl = document.getElementById('fmName');
        if (nameEl) nameEl.focus();
    }

    function closeModal() {
        var modal = document.getElementById('facilityModal');
        if (modal) modal.style.display = 'none';
        state.editingId = null;
    }

    /* ══════════════════════════════════════════
       폼 제출 (등록 / 수정)
    ══════════════════════════════════════════ */
    function handleSubmit() {
        var name     = (getVal('fmName')     || '').trim();
        var location = (getVal('fmLocation') || '').trim();
        var capacity = parseInt(getVal('fmCapacity'), 10);
        var maxValue = parseInt(getVal('fmMaxValue'), 10);
        var maxUnit  = getVal('fmMaxUnit') || '일';
        var mgrId    = getVal('fmManager') || null;
        var statusEl = document.querySelector('input[name="fmStatus"]:checked');

        if (!name)              { alert('시설명을 입력하세요.'); focusEl('fmName');     return; }
        if (!location)          { alert('위치를 입력하세요.');   focusEl('fmLocation'); return; }
        if (!capacity || capacity < 1) { alert('최대 수용인원을 입력하세요.'); focusEl('fmCapacity'); return; }
        if (!maxValue || maxValue < 1) { alert('최대 예약 기간을 입력하세요.'); focusEl('fmMaxValue'); return; }
        if (!statusEl)          { alert('상태를 선택하세요.'); return; }

        var mgrObj     = mgrId ? state.managers.find(function (m) { return String(m.id) === String(mgrId); }) : null;
        var mgrName    = mgrObj ? mgrObj.name : null;
        var status     = statusEl.value;
        var isEdit     = !!state.editingId;

        if (isEdit) {
            var idx = state.facilities.findIndex(function (f) { return f.id === state.editingId; });
            if (idx !== -1) {
                state.facilities[idx] = Object.assign({}, state.facilities[idx], {
                    name:        name,
                    location:    location,
                    managerId:   mgrId ? parseInt(mgrId, 10) : null,
                    managerName: mgrName,
                    capacity:    capacity,
                    maxValue:    maxValue,
                    maxUnit:     maxUnit,
                    status:      status
                });
            }
        } else {
            var newId = state.facilities.length > 0
                ? Math.max.apply(null, state.facilities.map(function (f) { return f.id; })) + 1
                : 1;
            state.facilities.push({
                id:          newId,
                name:        name,
                location:    location,
                managerId:   mgrId ? parseInt(mgrId, 10) : null,
                managerName: mgrName,
                capacity:    capacity,
                maxValue:    maxValue,
                maxUnit:     maxUnit,
                status:      status
            });
        }

        closeModal();
        renderStats();
        renderTable();

        /* ── 실제 서버 전송 (DB 연동 시 주석 해제) ──
        var ctx = window.App ? App.ctx : '';
        App.fetch(ctx + '/facility.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action:              isEdit ? 'update' : 'save',
                facilityId:          isEdit ? state.editingId : '',
                name:                name,
                location:            location,
                managerId:           mgrId || '',
                maxCapacity:         capacity,
                maxReservationUnit:  maxUnit,
                maxReservationValue: maxValue,
                status:              status
            })
        }).then(function(res) { return res.json(); })
          .then(function(data) { if (!data.success) alert('처리 중 오류가 발생했습니다.'); });
        ── */
    }

    /* ══════════════════════════════════════════
       삭제 (인라인 확인)
    ══════════════════════════════════════════ */
    function showInlineConfirm(id, row) {
        var cell = row ? row.querySelector('.fm-manage-cell') : null;
        if (!cell) return;
        cell.innerHTML =
            '<span class="fm-del-msg">정말 삭제하시겠습니까?</span>'
            + '<button class="btn-danger-sm" data-action="confirm-delete" data-id="' + id + '">확인</button>'
            + '<button class="btn-muted-sm"  data-action="cancel-delete">취소</button>';
    }

    function execDelete(id) {
        state.facilities = state.facilities.filter(function (f) { return f.id !== id; });
        renderStats();
        renderTable();

        /* ── 실제 서버 전송 (DB 연동 시 주석 해제) ──
        App.fetch(App.ctx + '/facility.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'delete', facilityId: id })
        });
        ── */
    }

    /* ══════════════════════════════════════════
       유틸
    ══════════════════════════════════════════ */
    function setText(id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
    }
    function setVal(id, val) {
        var el = document.getElementById(id);
        if (el) el.value = (val === null || val === undefined) ? '' : val;
    }
    function getVal(id) {
        var el = document.getElementById(id);
        return el ? el.value : '';
    }
    function setRadio(name, value) {
        var radios = document.querySelectorAll('input[name="' + name + '"]');
        radios.forEach(function (r) { r.checked = (r.value === value); });
    }
    function focusEl(id) {
        var el = document.getElementById(id);
        if (el) el.focus();
    }
    function esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ── 외부 노출 ── */
    window.FacilityManage = { init: init };
})();
