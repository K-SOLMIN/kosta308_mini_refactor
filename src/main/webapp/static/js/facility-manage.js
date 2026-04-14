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

        // 서버 데이터가 없거나 비어있으면 Mock 데이터 사용 (테이블이 없는 경우 대비)
        var serverList = data.facilities || [];
        state.facilities = serverList.length > 0 ? serverList : getMockFacilities();

        var serverManagers = data.managers || [];
        state.managers = serverManagers.length > 0 ? serverManagers : getMockManagers();

        renderStats();
        renderTable();
        populateManagerSelect();
        setupListeners();

        // 테이블이 없을 경우를 대비한 안내 (콘솔)
        if (serverList.length === 0) {
            console.warn('[FacilityManage] 서버 데이터가 없어 Mock 데이터를 로드했습니다.');
        }
    }

    /* ══════════════════════════════════════════
       Mock 데이터 (풍부하게 보강)
    ══════════════════════════════════════════ */
    function getMockFacilities() {
        return [
            { id:101, name:'대강당 (Demo)',     location:'본관 3층',  managerId:2, managerName:'김관리', capacity:250, maxValue:1, maxUnit:'주', status:'정상' },
            { id:102, name:'컴퓨터실 1',      location:'별관 2층',  managerId:3, managerName:'이관리', capacity:40,  maxValue:3, maxUnit:'일', status:'정상' },
            { id:103, name:'컴퓨터실 2',      location:'별관 2층',  managerId:3, managerName:'이관리', capacity:40,  maxValue:3, maxUnit:'일', status:'수리' },
            { id:104, name:'회의실 A',        location:'본관 2층',  managerId:4, managerName:'박관리', capacity:15,  maxValue:2, maxUnit:'일', status:'정상' },
            { id:105, name:'회의실 B (점검)',  location:'본관 2층',  managerId:null, managerName:null,  capacity:12,  maxValue:2, maxUnit:'일', status:'점검' },
            { id:106, name:'세미나실 101',    location:'본관 1층',  managerId:null, managerName:null,  capacity:60,  maxValue:1, maxUnit:'일', status:'정상' },
            { id:107, name:'실내 체육관',     location:'체육관동',  managerId:5, managerName:'최관리', capacity:500, maxValue:1, maxUnit:'주', status:'정상' },
            { id:108, name:'음악실',          location:'별관 4층',  managerId:6, managerName:'수지',   capacity:45,  maxValue:2, maxUnit:'일', status:'정상' },
            { id:109, name:'무용 연습실',     location:'본관 지하1층', managerId:7, managerName:'솔민',   capacity:20,  maxValue:4, maxUnit:'일', status:'정상' }
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
            { id:8, name:'민중' }
        ];
    }

    /* ══════════════════════════════════════════
       통계 카드 렌더링
    ══════════════════════════════════════════ */
    function renderStats() {
        var all    = state.facilities;
        var total  = all.length;
        var normal = all.filter(function(f) { return f.status === '정상'; }).length;
        var repair = all.filter(function(f) { return f.status === '수리'; }).length;
        var inspection = all.filter(function(f) { return f.status === '점검'; }).length;
        var issue  = repair + inspection;
        var noMgr  = all.filter(function(f) { return !f.managerId; }).length;

        setText('fmStatTotal',  total);
        setText('fmStatNormal', normal);
        setText('fmStatIssue',  issue);
        setText('fmStatNoMgr',  noMgr);

        var pct = total > 0 ? Math.round((normal / total) * 100) : 0;
        setText('fmStatNormalPct', total > 0 ? pct + '% 가용 중' : '');

        renderStatusBar(total, normal, repair, inspection);
        renderAlertBanner(all);
    }

    function renderStatusBar(total, normal, repair, inspection) {
        var bar = document.getElementById('fmStatusBar');
        var legend = document.getElementById('fmBarLegend');
        var totalEl = document.getElementById('fmBarTotal');
        if (!bar || !legend) return;

        if (total === 0) {
            bar.innerHTML = '<div class="fm-bar-empty">데이터 없음</div>';
            legend.innerHTML = '';
            if (totalEl) totalEl.textContent = '';
            return;
        }

        if (totalEl) totalEl.textContent = '총 ' + total + '개';

        var pNormal = (normal / total) * 100;
        var pRepair = (repair / total) * 100;
        var pInspection = (inspection / total) * 100;

        bar.innerHTML = 
            (pNormal > 0 ? '<div class="fm-bar-segment normal"     style="width:' + pNormal + '%"     title="정상: ' + normal + '"></div>' : '') +
            (pRepair > 0 ? '<div class="fm-bar-segment repair"     style="width:' + pRepair + '%"     title="수리: ' + repair + '"></div>' : '') +
            (pInspection > 0 ? '<div class="fm-bar-segment inspection" style="width:' + pInspection + '%" title="점검: ' + inspection + '"></div>' : '');

        legend.innerHTML = 
            '<div class="fm-legend-item"><span class="fm-dot normal"></span>정상 (' + normal + ')</div>' +
            '<div class="fm-legend-item"><span class="fm-dot repair"></span>수리 (' + repair + ')</div>' +
            '<div class="fm-legend-item"><span class="fm-dot inspection"></span>점검 (' + inspection + ')</div>';
    }

    function renderAlertBanner(all) {
        var banner = document.getElementById('fmAlertBanner');
        var chips = document.getElementById('fmAlertChips');
        if (!banner || !chips) return;

        var repair = all.filter(function(f) { return f.status === '수리'; }).length;
        var noMgr  = all.filter(function(f) { return !f.managerId; }).length;

        if (repair === 0 && noMgr === 0) {
            banner.style.display = 'none';
            return;
        }

        banner.style.display = 'flex';
        var html = '';
        if (repair > 0) html += '<span class="fm-alert-chip red">수리 중 ' + repair + '건</span>';
        if (noMgr > 0)  html += '<span class="fm-alert-chip gold">담당자 미지정 ' + noMgr + '건</span>';
        chips.innerHTML = html;
    }

    /* ══════════════════════════════════════════
       테이블 렌더링
    ══════════════════════════════════════════ */
    function renderTable() {
        var tbody = document.getElementById('fmTableBody');
        if (!tbody) return;

        var filtered = getFiltered();
        var colSpan  = state.isAdmin ? 8 : 7;

        setText('fmResultCount', filtered.length + '개 시설');

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="' + colSpan + '" class="dash-empty">조건에 맞는 시설이 없습니다.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function (f, i) {
            var managerCell = f.managerName
                ? '<span class="td-name">' + esc(f.managerName) + '</span>'
                : '<span class="fm-no-mgr" data-action="reassign">미배정 (클릭)</span>';

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
                + '<td style="cursor:pointer" data-action="reassign">' + managerCell + '</td>'
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
        sel.innerHTML = '<option value="">담당자 없음</option>';
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

        // 시설 모달 닫기
        bindClose('fmModalClose',  closeModal);
        bindClose('fmModalCancel', closeModal);
        
        // 담당자 재배정 모달 닫기
        bindClose('reassignModalClose', function() { toggleDisplay('reassignModal', false); });
        bindClose('reassignCancel',     function() { toggleDisplay('reassignModal', false); });

        // 모달 외부 클릭 닫기
        ['facilityModal', 'reassignModal'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('click', function(e) { if(e.target === el) toggleDisplay(id, false); });
        });

        // 모달 제출
        var submitBtn = document.getElementById('fmModalSubmit');
        if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
        
        var reassignBtn = document.getElementById('reassignSubmit');
        if (reassignBtn) reassignBtn.addEventListener('click', handleReassignSubmit);

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
                
                } else if (action === 'reassign') {
                    openReassignModal(id);
                }
            });
        }
    }

    function bindClose(id, fn) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    }

    function toggleDisplay(id, show) {
        var el = document.getElementById(id);
        if (el) el.style.display = show ? 'flex' : 'none';
    }

    /* ══════════════════════════════════════════
       담당자 재배정 모달
    ══════════════════════════════════════════ */
    function openReassignModal(id) {
        var fac = state.facilities.find(function(f) { return f.id === id; });
        if (!fac) return;
        state.editingId = id;

        setText('reassignTargetName', esc(fac.name) + ' 담당자 변경');
        
        var listEl = document.getElementById('mgrOptionList');
        if (listEl) {
            listEl.innerHTML = '<div class="mgr-opt' + (!fac.managerId ? ' selected' : '') + '" data-val="">담당자 미지정</div>'
                + state.managers.map(function(m) {
                    var sel = (m.id === fac.managerId) ? ' selected' : '';
                    return '<div class="mgr-opt' + sel + '" data-val="' + m.id + '">' + esc(m.name) + '</div>';
                }).join('');
            
            // 옵션 클릭 이벤트
            listEl.querySelectorAll('.mgr-opt').forEach(function(opt) {
                opt.addEventListener('click', function() {
                    listEl.querySelectorAll('.mgr-opt').forEach(function(o) { o.classList.remove('selected'); });
                    opt.classList.add('selected');
                });
            });
        }
        toggleDisplay('reassignModal', true);
    }

    function handleReassignSubmit() {
        var sel = document.querySelector('#mgrOptionList .mgr-opt.selected');
        var mgrId = sel ? sel.dataset.val : '';
        var fac = state.facilities.find(function(f) { return f.id === state.editingId; });
        if (!fac) return;

        var mgrObj = mgrId ? state.managers.find(function(m) { return String(m.id) === String(mgrId); }) : null;
        
        // 로컬 즉시 반영 (데모용)
        fac.managerId = mgrId ? parseInt(mgrId, 10) : null;
        fac.managerName = mgrObj ? mgrObj.name : null;

        toggleDisplay('reassignModal', false);
        renderStats();
        renderTable();

        // 서버 전송 시도
        var ctx = window.App ? App.ctx : '';
        App.fetch(ctx + '/facility.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'update',
                facilityId: fac.id,
                name: fac.name,
                location: fac.location,
                managerId: mgrId || '',
                maxCapacity: fac.capacity,
                maxReservationUnit: fac.maxUnit,
                maxReservationValue: fac.maxValue,
                status: fac.status
            }).toString()
        }).catch(function() { 
            console.log('서버에 테이블이 없어 DB에는 저장되지 않았습니다. (Demo Mode)');
        });
    }

    /* ══════════════════════════════════════════
       시설 모달 (등록/수정)
    ══════════════════════════════════════════ */
    function openModal(facility) {
        var modal     = document.getElementById('facilityModal');
        var titleEl   = document.getElementById('fmModalTitle');
        var submitBtn = document.getElementById('fmModalSubmit');
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
        toggleDisplay('facilityModal', false);
        state.editingId = null;
    }

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

        // 로컬 즉시 반영 (데모용)
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
                : 1000;
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

        // 서버 전송 시도
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
            }).toString()
        }).then(function(res) { return res.json(); })
          .catch(function() { console.log('Demo Mode: Server update skipped.'); });
    }

    /* ══════════════════════════════════════════
       삭제
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

        var ctx = window.App ? App.ctx : '';
        App.fetch(ctx + '/facility.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'delete', facilityId: id }).toString()
        }).catch(function() { console.log('Demo Mode: Server delete skipped.'); });
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
