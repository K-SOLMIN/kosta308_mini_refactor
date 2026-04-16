// ── 비품 관리 페이지 ──────────────────────────────────────────────
(function () {
    'use strict';

    var state = {
        equipments:     [],
        managers:       [],
        filterStatus:   'all',
        searchText:     '',
        editingId:      null,
        isAdmin:        false,
        userPermission: 'USER'
    };

    /* ══════════════════════════════════════════
       초기화
    ══════════════════════════════════════════ */
    function init() {
        var bridge = document.getElementById('emDataBridge');
        if (!bridge) {
            console.error('[EquipmentManage] Data bridge not found.');
            return;
        }

        state.isAdmin        = bridge.dataset.isAdmin === 'true';
        state.userPermission = (bridge.dataset.userPermission || 'USER').trim();

        try {
            var eqJson  = document.getElementById('emEquipmentsJson');
            state.equipments = eqJson ? JSON.parse(eqJson.textContent) : [];

            var mgrJson = document.getElementById('emManagersJson');
            state.managers = mgrJson ? JSON.parse(mgrJson.textContent) : [];
        } catch (e) {
            console.error('[EquipmentManage] JSON parse error:', e);
            state.equipments = [];
            state.managers   = [];
        }

        renderStats();
        renderTable();
        populateManagerSelect();
        setupListeners();
    }

    /* ══════════════════════════════════════════
       통계 카드
    ══════════════════════════════════════════ */
    function renderStats() {
        var all        = state.equipments;
        var total      = all.length;
        var normal     = all.filter(function(e) { return e.status === '정상'; }).length;
        var repair     = all.filter(function(e) { return e.status === '수리'; }).length;
        var inspection = all.filter(function(e) { return e.status === '점검'; }).length;
        var issue      = repair + inspection;
        var noMgr      = all.filter(function(e) { return !e.managerId; }).length;

        setText('emStatTotal',  total);
        setText('emStatNormal', normal);
        setText('emStatIssue',  issue);
        setText('emStatNoMgr',  noMgr);

        var pct = total > 0 ? Math.round((normal / total) * 100) : 0;
        setText('emStatNormalPct', total > 0 ? pct + '% 가용 중' : '');

        renderStatusBar(total, normal, repair, inspection);
        renderAlertBanner(all);
    }

    function renderStatusBar(total, normal, repair, inspection) {
        var bar     = document.getElementById('emStatusBar');
        var legend  = document.getElementById('emBarLegend');
        var totalEl = document.getElementById('emBarTotal');
        if (!bar || !legend) return;

        if (total === 0) {
            bar.innerHTML    = '<div class="fm-bar-empty">데이터 없음</div>';
            legend.innerHTML = '';
            if (totalEl) totalEl.textContent = '';
            return;
        }

        if (totalEl) totalEl.textContent = '총 ' + total + '개';

        var pN = (normal / total) * 100;
        var pR = (repair / total) * 100;
        var pI = (inspection / total) * 100;

        bar.innerHTML =
            (pN > 0 ? '<div class="fm-bar-segment normal"     style="width:' + pN + '%"     title="정상: ' + normal + '"></div>' : '') +
            (pR > 0 ? '<div class="fm-bar-segment repair"     style="width:' + pR + '%"     title="수리: ' + repair + '"></div>' : '') +
            (pI > 0 ? '<div class="fm-bar-segment inspection" style="width:' + pI + '%" title="점검: ' + inspection + '"></div>' : '');

        legend.innerHTML =
            '<div class="fm-legend-item"><span class="fm-dot normal"></span>정상 (' + normal + ')</div>' +
            '<div class="fm-legend-item"><span class="fm-dot repair"></span>수리 (' + repair + ')</div>' +
            '<div class="fm-legend-item"><span class="fm-dot inspection"></span>점검 (' + inspection + ')</div>';
    }

    function renderAlertBanner(all) {
        var banner = document.getElementById('emAlertBanner');
        var chips  = document.getElementById('emAlertChips');
        if (!banner || !chips) return;

        var repair = all.filter(function(e) { return e.status === '수리'; }).length;
        var noMgr  = all.filter(function(e) { return !e.managerId; }).length;

        if (repair === 0 && noMgr === 0) {
            banner.style.display = 'none';
            return;
        }
        banner.style.display = 'flex';
        var html = '';
        if (repair > 0) html += '<span class="fm-alert-chip red">수리 중 ' + repair + '건</span>';
        if (noMgr  > 0) html += '<span class="fm-alert-chip gold">담당자 미지정 ' + noMgr + '건</span>';
        chips.innerHTML = html;
    }

    /* ══════════════════════════════════════════
       테이블 렌더링
    ══════════════════════════════════════════ */
    function renderTable() {
        var tbody   = document.getElementById('emTableBody');
        if (!tbody) return;

        var filtered = getFiltered();
        var colSpan  = state.isAdmin ? 8 : 7;

        setText('emResultCount', filtered.length + '개 비품');

        if (filtered.length === 0) {
            var msg = state.equipments.length === 0
                ? (state.userPermission === 'ADMIN' ? '등록된 비품이 없습니다.' : '관리 중인 비품이 없습니다.')
                : '조건에 맞는 비품이 없습니다.';
            tbody.innerHTML = '<tr><td colspan="' + colSpan + '" class="dash-empty">' + msg + '</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function (eq, i) {
            var manageCell = state.isAdmin
                ? '<td class="fm-manage-cell">'
                    + '<button class="btn-tbl-edit" data-action="edit"   data-id="' + eq.id + '">수정</button>'
                    + '<button class="btn-tbl-del"  data-action="delete" data-id="' + eq.id + '">삭제</button>'
                  + '</td>'
                : '';

            return '<tr data-id="' + eq.id + '">'
                + '<td class="col-idx">' + (i + 1) + '</td>'
                + '<td class="td-name">' + esc(eq.name) + '</td>'
                + '<td>' + esc(eq.location) + '</td>'
                + '<td>' + (eq.facilityName ? esc(eq.facilityName) : '<span style="color:#8a9bab">-</span>') + '</td>'
                + '<td><code style="font-size:12px;">' + esc(eq.serialNo || '-') + '</code></td>'
                + '<td>' + (eq.managerName ? esc(eq.managerName) : '<span class="fm-no-mgr">미배정</span>') + '</td>'
                + '<td class="col-status">' + statusBadge(eq.status) + '</td>'
                + manageCell
                + '</tr>';
        }).join('');
    }

    function getFiltered() {
        var kw = state.searchText.toLowerCase();
        return state.equipments.filter(function (eq) {
            if (state.filterStatus !== 'all' && eq.status !== state.filterStatus) return false;
            if (!kw) return true;
            return (eq.name     || '').toLowerCase().indexOf(kw) >= 0
                || (eq.location || '').toLowerCase().indexOf(kw) >= 0
                || (eq.serialNo || '').toLowerCase().indexOf(kw) >= 0;
        });
    }

    function statusBadge(status) {
        var map = { '정상': 'approved', '수리': 'waiting', '점검': 'inspection' };
        return '<span class="status-badge ' + (map[status] || '') + '">' + esc(status) + '</span>';
    }

    /* ══════════════════════════════════════════
       담당자 Select 옵션 채우기
    ══════════════════════════════════════════ */
    function populateManagerSelect() {
        var sel = document.getElementById('emManager');
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

        // 검색
        var searchEl = document.getElementById('emSearch');
        if (searchEl) {
            searchEl.addEventListener('input', function () {
                state.searchText = this.value;
                renderTable();
            });
        }

        // 비품 등록 버튼
        var addBtn = document.getElementById('btnAddEquipment');
        if (addBtn) addBtn.addEventListener('click', function () { openModal(null); });

        // 모달 닫기
        bindClose('emModalClose',  closeModal);
        bindClose('emModalCancel', closeModal);

        // 모달 외부 클릭
        var modal = document.getElementById('equipmentModal');
        if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

        // 모달 제출
        var submitBtn = document.getElementById('emModalSubmit');
        if (submitBtn) submitBtn.addEventListener('click', handleSubmit);

        // 테이블 이벤트 위임
        var tbody = document.getElementById('emTableBody');
        if (tbody) {
            tbody.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-action]');
                if (!btn) return;

                var action = btn.dataset.action;
                var id     = parseInt(btn.dataset.id || btn.closest('tr').dataset.id, 10);

                if (action === 'edit') {
                    var eq = state.equipments.find(function (e) { return e.id === id; });
                    if (eq) openModal(eq);

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
       모달 (등록 / 수정)
    ══════════════════════════════════════════ */
    function openModal(equipment) {
        var modal     = document.getElementById('equipmentModal');
        var titleEl   = document.getElementById('emModalTitle');
        var submitBtn = document.getElementById('emModalSubmit');
        if (!modal) return;

        // 폼 초기화
        setVal('emEquipmentId', '');
        setVal('emName',        '');
        setVal('emLocation',    '');
        setVal('emSerialNo',    '');
        setVal('emManager',     '');
        setVal('emFacilityId',  '');
        setRadio('emStatus', '정상');

        if (equipment) {
            titleEl.textContent   = '비품 수정';
            submitBtn.textContent = '수정';
            state.editingId       = equipment.id;

            setVal('emEquipmentId', equipment.id);
            setVal('emName',        equipment.name     || '');
            setVal('emLocation',    equipment.location || '');
            setVal('emSerialNo',    equipment.serialNo || '');
            setVal('emManager',     equipment.managerId || '');
            setVal('emFacilityId',  equipment.facilityId || '');
            setRadio('emStatus',    equipment.status   || '정상');
        } else {
            titleEl.textContent   = '비품 등록';
            submitBtn.textContent = '등록';
            state.editingId       = null;
        }

        modal.style.display = 'flex';
        var nameEl = document.getElementById('emName');
        if (nameEl) nameEl.focus();
    }

    function closeModal() {
        var modal = document.getElementById('equipmentModal');
        if (modal) modal.style.display = 'none';
        state.editingId = null;
    }

    function handleSubmit() {
        var name       = (getVal('emName')     || '').trim();
        var location   = (getVal('emLocation') || '').trim();
        var serialNo   = (getVal('emSerialNo') || '').trim();
        var mgrId      = getVal('emManager')   || null;
        var facilityId = getVal('emFacilityId') || null;
        var statusEl   = document.querySelector('input[name="emStatus"]:checked');

        if (!name)     { alert('비품명을 입력하세요.');    focusEl('emName');     return; }
        if (!location) { alert('보관 위치를 입력하세요.'); focusEl('emLocation'); return; }
        if (!statusEl) { alert('상태를 선택하세요.');      return; }

        var mgrObj  = mgrId ? state.managers.find(function (m) { return String(m.id) === String(mgrId); }) : null;
        var mgrName = mgrObj ? mgrObj.name : null;
        var status  = statusEl.value;
        var isEdit  = !!state.editingId;

        // 로컬 즉시 반영
        if (isEdit) {
            var idx = state.equipments.findIndex(function (e) { return e.id === state.editingId; });
            if (idx !== -1) {
                state.equipments[idx] = Object.assign({}, state.equipments[idx], {
                    name:        name,
                    location:    location,
                    serialNo:    serialNo,
                    managerId:   mgrId ? parseInt(mgrId, 10) : null,
                    managerName: mgrName,
                    facilityId:  facilityId ? parseInt(facilityId, 10) : null,
                    status:      status
                });
            }
        } else {
            var newId = state.equipments.length > 0
                ? Math.max.apply(null, state.equipments.map(function (e) { return e.id; })) + 1
                : 1000;
            state.equipments.push({
                id:          newId,
                name:        name,
                location:    location,
                serialNo:    serialNo,
                managerId:   mgrId ? parseInt(mgrId, 10) : null,
                managerName: mgrName,
                facilityId:  facilityId ? parseInt(facilityId, 10) : null,
                facilityName: null,
                status:      status
            });
        }
        closeModal();
        renderStats();
        renderTable();

        // 서버 전송
        var ctx = window.App ? App.ctx : '';
        App.fetch(ctx + '/equipment.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action:      isEdit ? 'update' : 'save',
                equipmentId: isEdit ? state.editingId : '',
                name:        name,
                location:    location,
                serialNo:    serialNo,
                managerId:   mgrId   || '',
                facilityId:  facilityId || '',
                status:      status
            }).toString()
        }).then(function (res) { return res.json(); })
          .catch(function () { console.log('Demo Mode: Server update skipped.'); });
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
        state.equipments = state.equipments.filter(function (e) { return e.id !== id; });
        renderStats();
        renderTable();

        var ctx = window.App ? App.ctx : '';
        App.fetch(ctx + '/equipment.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'delete', equipmentId: id }).toString()
        }).catch(function () { console.log('Demo Mode: Server delete skipped.'); });
    }

    /* ══════════════════════════════════════════
       유틸
    ══════════════════════════════════════════ */
    function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
    function setVal(id, val)  { var el = document.getElementById(id); if (el) el.value = (val === null || val === undefined) ? '' : val; }
    function getVal(id)       { var el = document.getElementById(id); return el ? el.value : ''; }
    function focusEl(id)      { var el = document.getElementById(id); if (el) el.focus(); }
    function setRadio(name, value) {
        document.querySelectorAll('input[name="' + name + '"]').forEach(function (r) { r.checked = (r.value === value); });
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
    window.EquipmentManage = { init: init };
})();
