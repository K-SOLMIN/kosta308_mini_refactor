// ── 비품 관리 페이지 ──────────────────────────────────────────────
(function () {
    'use strict';

    var state = {
        equipments:       [],
        managers:         [],
        filterStatus:     'all',
        searchText:       '',
        editingId:        null,
        detailEquipId:    null,  // 현재 열린 낱개 모달의 equipment_id
        isAdmin:          false,
        userPermission:   'USER'
    };

    /* ══════════════════════════════════════════
       초기화
    ══════════════════════════════════════════ */
    function init() {
        var bridge = document.getElementById('emDataBridge');
        if (!bridge) { console.error('[EquipmentManage] bridge not found'); return; }

        state.isAdmin        = bridge.dataset.isAdmin === 'true';
        state.userPermission = (bridge.dataset.userPermission || 'USER').trim();

        try {
            state.equipments = JSON.parse(document.getElementById('emEquipmentsJson').textContent || '[]');
            state.managers   = JSON.parse(document.getElementById('emManagersJson').textContent   || '[]');
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
        var all      = state.equipments;
        var total    = all.length;
        var setItems = all.filter(function(e) { return e.isSet; });
        var singles  = all.filter(function(e) { return !e.isSet; });

        // 총 낱개 수 (세트만 집계)
        var totalDetails = setItems.reduce(function(s, e) { return s + e.detailCount; }, 0);
        var normalDetail = setItems.reduce(function(s, e) { return s + e.normalCount; }, 0);

        // 이슈 비품: is_set=0이면 status로 판단, is_set=1이면 issueCount > 0 또는 status
        var issueEq = all.filter(function(e) {
            if (e.isSet) return e.issueCount > 0;
            return e.status !== '정상';
        });
        var issueDetail = setItems.reduce(function(s, e) { return s + e.issueCount; }, 0);

        setText('emStatTotal',    total);
        setText('emStatSet',      setItems.length);
        setText('emStatSetSub',   totalDetails > 0 ? '총 ' + totalDetails + '개 낱개 · 정상 ' + normalDetail + '개' : '');
        setText('emStatSingle',   singles.length);
        setText('emStatIssue',    issueEq.length);
        setText('emStatIssueSub', issueDetail > 0 ? '낱개 이슈 ' + issueDetail + '건 포함' : '');

        renderStatusBar(all);
        renderAlertBanner(all, issueEq);
    }

    function renderStatusBar(all) {
        var bar     = document.getElementById('emStatusBar');
        var legend  = document.getElementById('emBarLegend');
        var totalEl = document.getElementById('emBarTotal');
        if (!bar || !legend) return;

        var total      = all.length;
        var normal     = all.filter(function(e) { return e.status === '정상'; }).length;
        var repair     = all.filter(function(e) { return e.status === '수리'; }).length;
        var inspection = all.filter(function(e) { return e.status === '점검'; }).length;

        if (total === 0) {
            bar.innerHTML = '<div class="fm-bar-empty">데이터 없음</div>';
            legend.innerHTML = '';
            if (totalEl) totalEl.textContent = '';
            return;
        }
        if (totalEl) totalEl.textContent = '총 ' + total + '종';

        var pN = (normal     / total) * 100;
        var pR = (repair     / total) * 100;
        var pI = (inspection / total) * 100;

        bar.innerHTML =
            (pN > 0 ? '<div class="fm-bar-segment normal"     style="width:' + pN + '%"     title="정상: ' + normal     + '"></div>' : '') +
            (pR > 0 ? '<div class="fm-bar-segment repair"     style="width:' + pR + '%"     title="수리: ' + repair     + '"></div>' : '') +
            (pI > 0 ? '<div class="fm-bar-segment inspection" style="width:' + pI + '%" title="점검: ' + inspection + '"></div>' : '');

        legend.innerHTML =
            '<div class="fm-legend-item"><span class="fm-dot normal"></span>정상 (' + normal     + ')</div>' +
            '<div class="fm-legend-item"><span class="fm-dot repair"></span>수리 (' + repair     + ')</div>' +
            '<div class="fm-legend-item"><span class="fm-dot inspection"></span>점검 (' + inspection + ')</div>';
    }

    function renderAlertBanner(all, issueEq) {
        var banner = document.getElementById('emAlertBanner');
        var chips  = document.getElementById('emAlertChips');
        if (!banner || !chips) return;

        var repair = all.filter(function(e) { return e.status === '수리'; }).length;
        var noMgr  = all.filter(function(e) { return !e.managerId; }).length;
        var lost   = all.reduce(function(s, e) { return s + (e.isSet ? (e.detailCount - e.normalCount - (e.issueCount)) : 0); }, 0);

        // 낱개 중 분실 항목 찾기 - 단순히 issueCount로 표시
        var setIssue = all.reduce(function(s, e) { return s + (e.isSet ? e.issueCount : 0); }, 0);

        if (repair === 0 && noMgr === 0 && setIssue === 0) {
            banner.style.display = 'none';
            return;
        }
        banner.style.display = 'flex';
        var html = '';
        if (repair   > 0) html += '<span class="fm-alert-chip red">수리 중 ' + repair + '건</span>';
        if (setIssue > 0) html += '<span class="fm-alert-chip red">낱개 이슈 ' + setIssue + '건</span>';
        if (noMgr    > 0) html += '<span class="fm-alert-chip gold">담당자 미지정 ' + noMgr + '건</span>';
        chips.innerHTML = html;
    }

    /* ══════════════════════════════════════════
       테이블 렌더링
    ══════════════════════════════════════════ */
    function renderTable() {
        var tbody   = document.getElementById('emTableBody');
        if (!tbody) return;

        var filtered = getFiltered();
        var colSpan  = state.isAdmin ? 9 : 8;

        setText('emResultCount', filtered.length + '개 비품');

        if (filtered.length === 0) {
            var msg = state.equipments.length === 0
                ? (state.userPermission === 'ADMIN' ? '등록된 비품이 없습니다.' : '관리 가능한 비품이 없습니다.')
                : '조건에 맞는 비품이 없습니다.';
            tbody.innerHTML = '<tr><td colspan="' + colSpan + '" class="dash-empty">' + msg + '</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function (eq, i) {
            var typeBadge = eq.isSet
                ? '<span class="em-type-badge em-type-set">세트</span>'
                : '<span class="em-type-badge em-type-single">단품</span>';

            // 수량/시리얼 셀
            var qtyCell;
            if (eq.isSet && eq.detailCount > 0) {
                var pct     = Math.round((eq.normalCount / eq.detailCount) * 100);
                var hasIss  = eq.issueCount > 0;
                qtyCell =
                    '<div class="em-qty-cell">' +
                        '<div class="em-qty-text"><b>' + eq.normalCount + '</b> / ' + eq.detailCount + '개 정상</div>' +
                        '<div class="em-qty-bar-wrap"><div class="em-qty-bar' + (hasIss ? ' has-issue' : '') + '" style="width:' + pct + '%"></div></div>' +
                        (hasIss ? '<div class="em-qty-issue">이슈 ' + eq.issueCount + '건</div>' : '') +
                    '</div>';
            } else if (eq.isSet) {
                qtyCell = '<span style="color:#8a9bab;font-size:12px;">낱개 없음</span>';
            } else {
                qtyCell = '<code style="font-size:12px;">' + esc(eq.serialNo || '-') + '</code>';
            }

            var manageCell = '';
            if (state.isAdmin) {
                manageCell = '<td class="fm-manage-cell">' +
                    '<button class="btn-tbl-edit" data-action="edit"   data-id="' + eq.id + '">수정</button>' +
                    '<button class="btn-tbl-del"  data-action="delete" data-id="' + eq.id + '">삭제</button>' +
                    (eq.isSet ? '<button class="btn-tbl-detail" data-action="detail" data-id="' + eq.id + '" data-name="' + esc(eq.name) + '">낱개</button>' : '') +
                '</td>';
            }

            return '<tr data-id="' + eq.id + '">'
                + '<td class="col-idx">' + (i + 1) + '</td>'
                + '<td>' + typeBadge + '</td>'
                + '<td class="td-name">' + esc(eq.name) + '</td>'
                + '<td>' + esc(eq.location) + '</td>'
                + '<td>' + (eq.facilityName ? esc(eq.facilityName) : '<span style="color:#8a9bab">-</span>') + '</td>'
                + '<td>' + qtyCell + '</td>'
                + '<td>' + (eq.managerName ? esc(eq.managerName) : '<span class="fm-no-mgr">미배정</span>') + '</td>'
                + '<td class="col-status">' + statusBadge(eq.status) + '</td>'
                + manageCell
                + '</tr>';
        }).join('');
    }

    /* ── 필터 ── */
    function getFiltered() {
        var kw = state.searchText.toLowerCase();
        return state.equipments.filter(function (eq) {
            var f = state.filterStatus;
            if (f === 'set'    && !eq.isSet)                       return false;
            if (f === 'single' &&  eq.isSet)                       return false;
            if (f === '정상'   &&  eq.status !== '정상')            return false;
            if (f === 'issue'  && eq.status === '정상' && eq.issueCount === 0) return false;
            if (!kw) return true;
            return (eq.name     || '').toLowerCase().indexOf(kw) >= 0
                || (eq.location || '').toLowerCase().indexOf(kw) >= 0
                || (eq.serialNo || '').toLowerCase().indexOf(kw) >= 0;
        });
    }

    function statusBadge(status) {
        var map = { '정상': 'approved', '수리': 'waiting', '점검': 'inspection', '분실': 'rejected' };
        return '<span class="status-badge ' + (map[status] || '') + '">' + esc(status) + '</span>';
    }

    /* ══════════════════════════════════════════
       담당자 Select 채우기
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
        if (searchEl) searchEl.addEventListener('input', function () { state.searchText = this.value; renderTable(); });

        // 등록 버튼
        var addBtn = document.getElementById('btnAddEquipment');
        if (addBtn) addBtn.addEventListener('click', function () { openModal(null); });

        // 등록 모달 닫기
        bindClose('emModalClose',  closeModal);
        bindClose('emModalCancel', closeModal);
        var modal = document.getElementById('equipmentModal');
        if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

        // 모달 제출
        var submitBtn = document.getElementById('emModalSubmit');
        if (submitBtn) submitBtn.addEventListener('click', handleSubmit);

        // 세트 여부 라디오 변경 → 수량 필드 표시/숨김
        document.querySelectorAll('input[name="emIsSet"]').forEach(function (r) {
            r.addEventListener('change', function () { toggleSetFields(); });
        });

        // 낱개 모달 닫기
        bindClose('detailModalClose',  closeDetailModal);
        bindClose('detailModalClose2', closeDetailModal);
        var dm = document.getElementById('detailModal');
        if (dm) dm.addEventListener('click', function (e) { if (e.target === dm) closeDetailModal(); });

        // 낱개 추가 버튼
        var addDetailBtn = document.getElementById('detailAddBtn');
        if (addDetailBtn) addDetailBtn.addEventListener('click', handleAddDetail);

        // 테이블 이벤트 위임
        var tbody = document.getElementById('emTableBody');
        if (tbody) {
            tbody.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-action]');
                if (!btn) return;
                var action = btn.dataset.action;
                var id     = parseInt(btn.dataset.id || btn.closest('tr').dataset.id, 10);

                if      (action === 'edit')           { var eq = state.equipments.find(function(e) { return e.id === id; }); if (eq) openModal(eq); }
                else if (action === 'delete')         { showInlineConfirm(id, btn.closest('tr')); }
                else if (action === 'confirm-delete') { execDelete(id); }
                else if (action === 'cancel-delete')  { renderTable(); }
                else if (action === 'detail')         { openDetailModal(id, btn.dataset.name); }
            });
        }
    }

    function bindClose(id, fn) { var el = document.getElementById(id); if (el) el.addEventListener('click', fn); }

    function toggleSetFields() {
        var isSet     = getRadio('emIsSet') === 'true';
        var qtyGroup  = document.getElementById('emQuantityGroup');
        var serialLbl = document.getElementById('emSerialLabel');
        if (qtyGroup)  qtyGroup.style.display  = isSet ? '' : 'none';
        if (serialLbl) serialLbl.textContent    = isSet ? '시리얼 접두사' : '시리얼 번호';
        if (isSet) setVal('emSerialNo', getVal('emSerialNo') || '');
    }

    /* ══════════════════════════════════════════
       등록·수정 모달
    ══════════════════════════════════════════ */
    function openModal(equipment) {
        var modal     = document.getElementById('equipmentModal');
        var titleEl   = document.getElementById('emModalTitle');
        var submitBtn = document.getElementById('emModalSubmit');
        if (!modal) return;

        setVal('emEquipmentId', '');
        setVal('emName',        '');
        setVal('emLocation',    '');
        setVal('emSerialNo',    '');
        setVal('emManager',     '');
        setVal('emFacilityId',  '');
        setVal('emQuantity',    '');
        setRadio('emIsSet',   'false');
        setRadio('emStatus',  '정상');
        toggleSetFields();

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
            setRadio('emIsSet',  equipment.isSet ? 'true' : 'false');
            setRadio('emStatus', equipment.status || '정상');
            toggleSetFields();
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
        var mgrId      = getVal('emManager')    || null;
        var facilityId = getVal('emFacilityId') || null;
        var isSet      = getRadio('emIsSet') === 'true';
        var quantity   = parseInt(getVal('emQuantity'), 10);
        var statusEl   = document.querySelector('input[name="emStatus"]:checked');

        if (!name)                             { alert('비품명을 입력하세요.');    focusEl('emName');     return; }
        if (!location)                         { alert('보관 위치를 입력하세요.'); focusEl('emLocation'); return; }
        if (isSet && (!quantity || quantity < 1)) { alert('낱개 수량을 입력하세요.'); focusEl('emQuantity'); return; }
        if (!statusEl)                         { alert('상태를 선택하세요.');      return; }

        var mgrObj   = mgrId ? state.managers.find(function (m) { return String(m.id) === String(mgrId); }) : null;
        var mgrName  = mgrObj ? mgrObj.name : null;
        var status   = statusEl.value;
        var isEdit   = !!state.editingId;

        // 로컬 즉시 반영
        if (isEdit) {
            var idx = state.equipments.findIndex(function (e) { return e.id === state.editingId; });
            if (idx !== -1) {
                state.equipments[idx] = Object.assign({}, state.equipments[idx], {
                    name: name, location: location, serialNo: serialNo,
                    managerId: mgrId ? parseInt(mgrId, 10) : null, managerName: mgrName,
                    facilityId: facilityId ? parseInt(facilityId, 10) : null,
                    isSet: isSet, status: status
                });
            }
        } else {
            var newId = state.equipments.length > 0
                ? Math.max.apply(null, state.equipments.map(function (e) { return e.id; })) + 1 : 1000;
            state.equipments.push({
                id: newId, name: name, location: location, serialNo: serialNo,
                managerId: mgrId ? parseInt(mgrId, 10) : null, managerName: mgrName,
                facilityId: facilityId ? parseInt(facilityId, 10) : null, facilityName: null,
                isSet: isSet, status: status,
                detailCount: isSet ? quantity : 0, normalCount: isSet ? quantity : 0, issueCount: 0
            });
        }
        closeModal();
        renderStats();
        renderTable();

        // 서버 전송
        var params = {
            action:      isEdit ? 'update' : 'save',
            equipmentId: isEdit ? state.editingId : '',
            name: name, location: location, serialNo: serialNo,
            managerId: mgrId || '', facilityId: facilityId || '',
            isSet: String(isSet), status: status
        };
        if (isSet && !isEdit) params.quantity = quantity;

        App.fetch(App.ctx + '/equipment.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(params).toString()
        }).catch(function () { console.log('Demo Mode: Server update skipped.'); });
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
        App.fetch(App.ctx + '/equipment.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'delete', equipmentId: id }).toString()
        }).catch(function () {});
    }

    /* ══════════════════════════════════════════
       낱개 상세 모달
    ══════════════════════════════════════════ */
    function openDetailModal(equipmentId, equipmentName) {
        var modal = document.getElementById('detailModal');
        if (!modal) return;

        state.detailEquipId = equipmentId;
        setText('detailModalTitle', esc(equipmentName || '') + ' 낱개 목록');
        setText('detailTableBody', '');
        var tbody = document.getElementById('detailTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="dash-empty">불러오는 중...</td></tr>';

        modal.style.display = 'flex';
        loadDetails(equipmentId);
    }

    function closeDetailModal() {
        var modal = document.getElementById('detailModal');
        if (modal) modal.style.display = 'none';
        state.detailEquipId = null;
    }

    function loadDetails(equipmentId) {
        App.fetch(App.ctx + '/equipment.do?action=details&equipmentId=' + equipmentId)
            .then(function (res) { return res.json(); })
            .then(function (details) { renderDetailTable(details); })
            .catch(function (err) {
                var tbody = document.getElementById('detailTableBody');
                if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="dash-empty">조회 실패</td></tr>';
            });
    }

    function renderDetailTable(details) {
        // 통계 요약
        var statRow = document.getElementById('detailStatRow');
        if (statRow) {
            var cnt = { '정상': 0, '수리': 0, '점검': 0, '분실': 0 };
            details.forEach(function (d) { if (cnt[d.status] !== undefined) cnt[d.status]++; else cnt[d.status] = 1; });
            statRow.innerHTML =
                (cnt['정상'] > 0 ? '<span class="detail-stat-chip normal">정상 ' + cnt['정상'] + '</span>'  : '') +
                (cnt['수리'] > 0 ? '<span class="detail-stat-chip repair">수리 ' + cnt['수리'] + '</span>'  : '') +
                (cnt['점검'] > 0 ? '<span class="detail-stat-chip inspect">점검 ' + cnt['점검'] + '</span>' : '') +
                (cnt['분실'] > 0 ? '<span class="detail-stat-chip lost">분실 ' + cnt['분실'] + '</span>'    : '') +
                '<span style="font-size:12px;color:#8a9bab;margin-left:4px;">총 ' + details.length + '개</span>';
        }

        // 테이블 렌더
        var tbody = document.getElementById('detailTableBody');
        if (!tbody) return;

        if (details.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="dash-empty">등록된 낱개가 없습니다.</td></tr>';
            return;
        }

        tbody.innerHTML = details.map(function (d, i) {
            var statusOptions = ['정상', '수리', '점검', '분실'].map(function (s) {
                return '<option value="' + s + '"' + (d.status === s ? ' selected' : '') + '>' + s + '</option>';
            }).join('');

            var manageCell = state.isAdmin
                ? '<td class="fm-manage-cell">' +
                    '<select class="detail-status-sel" data-detail-id="' + d.id + '" data-action="changeStatus">' + statusOptions + '</select> ' +
                    '<button class="btn-tbl-del" data-action="deleteDetail" data-detail-id="' + d.id + '">삭제</button>' +
                  '</td>'
                : '<td class="fm-manage-cell">-</td>';

            return '<tr>'
                + '<td class="col-idx">' + (i + 1) + '</td>'
                + '<td><code style="font-size:12px;">' + esc(d.serialNo) + '</code></td>'
                + '<td class="col-status">' + statusBadge(d.status) + '</td>'
                + manageCell
                + '</tr>';
        }).join('');

        // 낱개 이벤트 위임 (매번 재바인딩)
        tbody.addEventListener('change', function (e) {
            var sel = e.target.closest('[data-action="changeStatus"]');
            if (!sel) return;
            var detailId = sel.dataset.detailId;
            var newStatus = sel.value;
            App.fetch(App.ctx + '/equipment.do', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'updateDetailStatus', equipmentDetailId: detailId, status: newStatus }).toString()
            }).then(function (res) { return res.json(); })
              .then(function (res) {
                  if (res.success) {
                      // 통계 다시 로드
                      loadDetails(state.detailEquipId);
                      // 메인 테이블 집계 업데이트 (간단히 서버 재조회 대신 로컬 반영)
                      updateLocalDetailStat(state.detailEquipId);
                  }
              })
              .catch(function () {});
        });

        tbody.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-action="deleteDetail"]');
            if (!btn) return;
            if (!confirm('이 낱개를 삭제하시겠습니까?')) return;
            var detailId = btn.dataset.detailId;
            App.fetch(App.ctx + '/equipment.do', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'deleteDetail', equipmentDetailId: detailId }).toString()
            }).then(function (res) { return res.json(); })
              .then(function (res) {
                  if (res.success) {
                      loadDetails(state.detailEquipId);
                      updateLocalDetailStat(state.detailEquipId);
                  }
              })
              .catch(function () {});
        });
    }

    function handleAddDetail() {
        var serial = (getVal('detailNewSerial') || '').trim();
        if (!serial) { alert('시리얼번호를 입력하세요.'); focusEl('detailNewSerial'); return; }
        if (!state.detailEquipId) return;

        App.fetch(App.ctx + '/equipment.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'addDetail', equipmentId: state.detailEquipId, serialNo: serial }).toString()
        }).then(function (res) { return res.json(); })
          .then(function (res) {
              if (res.success) {
                  setVal('detailNewSerial', '');
                  loadDetails(state.detailEquipId);
                  updateLocalDetailStat(state.detailEquipId);
              } else {
                  alert('추가 실패');
              }
          })
          .catch(function () {});
    }

    // 메인 테이블 세트 집계 로컬 업데이트 (모달에서 변경 후 반영)
    function updateLocalDetailStat(equipmentId) {
        App.fetch(App.ctx + '/equipment.do?action=details&equipmentId=' + equipmentId)
            .then(function (res) { return res.json(); })
            .then(function (details) {
                var eq = state.equipments.find(function (e) { return e.id === equipmentId; });
                if (!eq) return;
                eq.detailCount  = details.length;
                eq.normalCount  = details.filter(function (d) { return d.status === '정상'; }).length;
                eq.issueCount   = details.filter(function (d) { return d.status !== '정상'; }).length;
                renderStats();
                renderTable();
            }).catch(function () {});
    }

    /* ══════════════════════════════════════════
       유틸
    ══════════════════════════════════════════ */
    function setText(id, val)  { var el = document.getElementById(id); if (el) el.textContent = (val === null || val === undefined) ? '' : val; }
    function setVal(id, val)   { var el = document.getElementById(id); if (el) el.value = (val === null || val === undefined) ? '' : val; }
    function getVal(id)        { var el = document.getElementById(id); return el ? el.value : ''; }
    function focusEl(id)       { var el = document.getElementById(id); if (el) el.focus(); }
    function setRadio(name, value) { document.querySelectorAll('input[name="' + name + '"]').forEach(function (r) { r.checked = (r.value === value); }); }
    function getRadio(name)    { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : null; }
    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    window.EquipmentManage = { init: init };
})();
