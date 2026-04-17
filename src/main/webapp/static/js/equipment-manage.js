// ── 비품 관리 페이지 ──────────────────────────────────────────────
(function () {
    'use strict';

    var DETAIL_STATUSES = ['정상', '수리', '점검', '분실'];

    var state = {
        equipments:     [],
        managers:       [],
        facilities:     [],
        filterStatus:   'all',
        searchText:     '',
        editingId:      null,
        isAdmin:        false,
        userPermission: 'USER',
        expanded:       {}   // equipmentId → true (펼침 상태 추적)
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
            state.equipments = JSON.parse(document.getElementById('emEquipmentsJson').textContent  || '[]');
            state.managers   = JSON.parse(document.getElementById('emManagersJson').textContent    || '[]');
            state.facilities = JSON.parse(document.getElementById('emFacilitiesJson').textContent  || '[]');
        } catch (e) {
            console.error('[EquipmentManage] JSON parse error:', e);
            state.equipments = [];
            state.managers   = [];
            state.facilities = [];
        }

        renderStats();
        renderTable();
        populateManagerSelect();
        populateFacilitySelect();
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

        var totalDetails = setItems.reduce(function(s, e) { return s + e.detailCount; }, 0);
        var normalDetail = setItems.reduce(function(s, e) { return s + e.normalCount; }, 0);
        var issueDetail  = setItems.reduce(function(s, e) { return s + e.issueCount; }, 0);

        var issueEq = all.filter(function(e) {
            return e.isSet ? e.issueCount > 0 : e.status !== '정상';
        });

        setText('emStatTotal',    total);
        setText('emStatSet',      setItems.length);
        setText('emStatSetSub',   totalDetails > 0 ? '총 ' + totalDetails + '개 낱개 · 정상 ' + normalDetail + '개' : '');
        setText('emStatSingle',   singles.length);
        setText('emStatIssue',    issueEq.length);
        setText('emStatIssueSub', issueDetail > 0 ? '낱개 이슈 ' + issueDetail + '건 포함' : '');

        renderStatusBar(all);
        renderAlertBanner(all, issueDetail);
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
            bar.innerHTML    = '<div class="fm-bar-empty">데이터 없음</div>';
            legend.innerHTML = '';
            if (totalEl) totalEl.textContent = '';
            return;
        }
        if (totalEl) totalEl.textContent = '총 ' + total + '종';

        var pN = (normal     / total) * 100;
        var pR = (repair     / total) * 100;
        var pI = (inspection / total) * 100;

        bar.innerHTML =
            (pN > 0 ? '<div class="fm-bar-segment normal"     style="width:' + pN + '%" title="정상: '  + normal     + '"></div>' : '') +
            (pR > 0 ? '<div class="fm-bar-segment repair"     style="width:' + pR + '%" title="수리: '  + repair     + '"></div>' : '') +
            (pI > 0 ? '<div class="fm-bar-segment inspection" style="width:' + pI + '%" title="점검: '  + inspection + '"></div>' : '');

        legend.innerHTML =
            '<div class="fm-legend-item"><span class="fm-dot normal"></span>정상 ('     + normal     + ')</div>' +
            '<div class="fm-legend-item"><span class="fm-dot repair"></span>수리 ('     + repair     + ')</div>' +
            '<div class="fm-legend-item"><span class="fm-dot inspection"></span>점검 (' + inspection + ')</div>';
    }

    function renderAlertBanner(all, issueDetail) {
        var banner = document.getElementById('emAlertBanner');
        var chips  = document.getElementById('emAlertChips');
        if (!banner || !chips) return;

        var repair = all.filter(function(e) { return e.status === '수리'; }).length;
        var noMgr  = all.filter(function(e) { return !e.managerId; }).length;

        if (repair === 0 && noMgr === 0 && issueDetail === 0) {
            banner.style.display = 'none';
            return;
        }
        banner.style.display = 'flex';
        var html = '';
        if (repair      > 0) html += '<span class="fm-alert-chip red">수리 중 '     + repair      + '건</span>';
        if (issueDetail > 0) html += '<span class="fm-alert-chip red">낱개 이슈 '   + issueDetail + '건</span>';
        if (noMgr       > 0) html += '<span class="fm-alert-chip gold">담당자 미지정 ' + noMgr + '건</span>';
        chips.innerHTML = html;
    }

    /* ══════════════════════════════════════════
       테이블 렌더링
    ══════════════════════════════════════════ */
    function renderTable() {
        var tbody  = document.getElementById('emTableBody');
        if (!tbody) return;

        // 필터·검색 변경 시 펼침 상태 초기화
        state.expanded = {};

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
            var isSet     = eq.isSet;
            var typeBadge = isSet
                ? '<span class="em-type-badge em-type-set">세트</span>'
                : '<span class="em-type-badge em-type-single">단품</span>';

            // 수량/시리얼 셀
            var qtyCell;
            if (isSet && eq.detailCount > 0) {
                var pct    = Math.round((eq.normalCount / eq.detailCount) * 100);
                var hasIss = eq.issueCount > 0;
                qtyCell =
                    '<div class="em-qty-cell">' +
                        '<div class="em-qty-text"><b>' + eq.normalCount + '</b> / ' + eq.detailCount + '개 정상</div>' +
                        '<div class="em-qty-bar-wrap"><div class="em-qty-bar' + (hasIss ? ' has-issue' : '') + '" style="width:' + pct + '%"></div></div>' +
                        (hasIss ? '<div class="em-qty-issue">이슈 ' + eq.issueCount + '건</div>' : '') +
                    '</div>';
            } else if (isSet) {
                qtyCell = '<span style="color:#8a9bab;font-size:12px;">낱개 없음</span>';
            } else {
                qtyCell = '<code style="font-size:12px;">' + esc(eq.serialNo || '-') + '</code>';
            }

            // 모든 행에 펼침 아이콘
            var nameCell = '<span class="em-expand-icon" data-id="' + eq.id + '">▶</span> ' + esc(eq.name);

            // 관리 버튼 (낱개 버튼 없음)
            var manageCell = '';
            if (state.isAdmin) {
                manageCell = '<td class="fm-manage-cell">' +
                    '<button class="btn-tbl-edit" data-action="edit"   data-id="' + eq.id + '">수정</button>' +
                    '<button class="btn-tbl-del"  data-action="delete" data-id="' + eq.id + '">삭제</button>' +
                '</td>';
            }

            var rowClass = ' class="em-row-set' + (isSet ? '' : ' em-row-single') + '"';

            return '<tr data-id="' + eq.id + '" data-is-set="' + isSet + '"' + rowClass + '>'
                + '<td class="col-idx">' + (i + 1) + '</td>'
                + '<td>' + typeBadge + '</td>'
                + '<td class="td-name">' + nameCell + '</td>'
                + '<td>' + esc(eq.location) + '</td>'
                + '<td>' + (eq.facilityName ? esc(eq.facilityName) : '<span style="color:#8a9bab">-</span>') + '</td>'
                + '<td>' + qtyCell + '</td>'
                + '<td>' + (eq.managerName ? esc(eq.managerName) : '<span class="fm-no-mgr">미배정</span>') + '</td>'
                + '<td class="col-status">' + statusBadge(eq.status) + '</td>'
                + manageCell
                + '</tr>';
        }).join('');
    }

    function getFiltered() {
        var kw = state.searchText.toLowerCase();
        return state.equipments.filter(function (eq) {
            var f = state.filterStatus;
            if (f === 'set'    && !eq.isSet)                              return false;
            if (f === 'single' &&  eq.isSet)                              return false;
            if (f === '정상'   &&  eq.status !== '정상')                   return false;
            if (f === 'issue'  &&  eq.status === '정상' && eq.issueCount === 0) return false;
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
       아코디언: 세트 행 펼침/접기
    ══════════════════════════════════════════ */
    function toggleDetailRows(equipmentId, parentTr) {
        var alreadyExpanded = state.expanded[equipmentId];

        if (alreadyExpanded) {
            collapseDetailRows(equipmentId, parentTr);
        } else {
            expandDetailRows(equipmentId, parentTr);
        }
    }

    function collapseDetailRows(equipmentId, parentTr) {
        state.expanded[equipmentId] = false;

        // 아이콘 원복
        var icon = parentTr.querySelector('.em-expand-icon');
        if (icon) icon.textContent = '▶';
        parentTr.classList.remove('em-row-expanded');

        // detail rows 제거
        removeDetailRows(equipmentId);
    }

    function removeDetailRows(equipmentId) {
        var tbody = document.getElementById('emTableBody');
        if (!tbody) return;
        tbody.querySelectorAll('tr.em-detail-row[data-parent-id="' + equipmentId + '"]')
             .forEach(function (r) { r.remove(); });
    }

    function expandDetailRows(equipmentId, parentTr) {
        state.expanded[equipmentId] = true;

        var icon = parentTr.querySelector('.em-expand-icon');
        if (icon) icon.textContent = '▼';
        parentTr.classList.add('em-row-expanded');

        var eq      = state.equipments.find(function (e) { return e.id === equipmentId; });
        var details = eq ? (eq.details || []) : [];
        insertDetailRows(equipmentId, parentTr, details);
    }

    function refreshDetailRows(equipmentId) {
        if (!state.expanded[equipmentId]) return;

        var parentTr = document.querySelector('#emTableBody tr[data-id="' + equipmentId + '"]');
        if (!parentTr) return;

        removeDetailRows(equipmentId);

        var eq = state.equipments.find(function (e) { return e.id === equipmentId; });
        if (!eq) return;

        // 집계 재계산
        var details    = eq.details || [];
        eq.detailCount = details.length;
        eq.normalCount = details.filter(function (d) { return d.status === '정상'; }).length;
        eq.issueCount  = details.filter(function (d) { return d.status !== '정상'; }).length;

        insertDetailRows(equipmentId, parentTr, details);
        renderStats();
        refreshQtyCell(parentTr, eq);
    }

    function insertDetailRows(equipmentId, parentTr, details) {
        var colSpan = state.isAdmin ? 9 : 8;

        // 빈 경우
        if (details.length === 0) {
            var emptyTr = makeDetailRow(equipmentId,
                '<td colspan="' + colSpan + '" style="text-align:center;color:#8a9bab;font-size:12px;padding:10px;">등록된 낱개가 없습니다.</td>');
            parentTr.after(emptyTr);
            if (state.isAdmin) appendAddRow(equipmentId, emptyTr);
            return;
        }

        // 낱개 행들 (역순 삽입으로 순서 유지)
        var insertRef = parentTr;
        details.forEach(function (d, i) {
            var statusOptions = DETAIL_STATUSES.map(function (s) {
                return '<option value="' + s + '"' + (d.status === s ? ' selected' : '') + '>' + s + '</option>';
            }).join('');

            var manageHtml = state.isAdmin
                ? '<select class="detail-status-sel" data-action="changeDetailStatus" data-detail-id="' + d.id + '">' + statusOptions + '</select>'
                  + ' <button class="btn-tbl-del" style="font-size:11px;" data-action="deleteDetail" data-detail-id="' + d.id + '" data-parent-id="' + equipmentId + '">삭제</button>'
                : '-';

            var tr = makeDetailRow(equipmentId,
                '<td style="border-left:3px solid #d0e4f7;"></td>' +
                '<td colspan="4" class="em-detail-indent">↳ <span style="color:#8a9bab;font-size:11px;">#' + (i + 1) + '</span></td>' +
                '<td><code style="font-size:12px;">' + esc(d.serialNo) + '</code></td>' +
                '<td></td>' +
                '<td class="col-status">' + statusBadge(d.status) + '</td>' +
                (state.isAdmin ? '<td class="fm-manage-cell" style="white-space:nowrap;">' + manageHtml + '</td>' : '')
            );
            tr.dataset.detailId = d.id;

            // insertRef 다음에 삽입
            insertRef.after(tr);
            insertRef = tr;
        });

        // 낱개 추가 행 (admin only)
        if (state.isAdmin) appendAddRow(equipmentId, insertRef);
    }

    function appendAddRow(equipmentId, insertRef) {
        var addTr = makeDetailRow(equipmentId,
            '<td style="border-left:3px solid #d0e4f7;"></td>' +
            '<td colspan="4" class="em-detail-indent" style="color:#52a3f5;font-size:12px;">+ 낱개 추가</td>' +
            '<td colspan="2">' +
                '<input type="text" class="form-input em-add-serial" placeholder="시리얼번호" ' +
                'style="font-size:12px;padding:3px 8px;margin:0;height:auto;" data-parent-id="' + equipmentId + '">' +
            '</td>' +
            '<td></td>' +
            (state.isAdmin ? '<td class="fm-manage-cell">' +
                '<button class="btn-tbl-edit" style="font-size:11px;" data-action="confirmAddDetail" data-parent-id="' + equipmentId + '">추가</button>' +
            '</td>' : '')
        );
        addTr.classList.add('em-detail-add-row');
        insertRef.after(addTr);
    }

    function makeDetailRow(equipmentId, innerHtml) {
        var tr = document.createElement('tr');
        tr.className           = 'em-detail-row';
        tr.dataset.parentId    = equipmentId;
        tr.innerHTML           = innerHtml;
        return tr;
    }

    // 해당 행의 수량/시리얼 셀만 교체 (renderTable 전체 재호출 없이)
    function refreshQtyCell(parentTr, eq) {
        var cells = parentTr.querySelectorAll('td');
        // 6번째 셀 (0-indexed: 5) = 수량/시리얼
        var qtyTd = cells[5];
        if (!qtyTd) return;

        if (eq.detailCount > 0) {
            var pct    = Math.round((eq.normalCount / eq.detailCount) * 100);
            var hasIss = eq.issueCount > 0;
            qtyTd.innerHTML =
                '<div class="em-qty-cell">' +
                    '<div class="em-qty-text"><b>' + eq.normalCount + '</b> / ' + eq.detailCount + '개 정상</div>' +
                    '<div class="em-qty-bar-wrap"><div class="em-qty-bar' + (hasIss ? ' has-issue' : '') + '" style="width:' + pct + '%"></div></div>' +
                    (hasIss ? '<div class="em-qty-issue">이슈 ' + eq.issueCount + '건</div>' : '') +
                '</div>';
        } else {
            qtyTd.innerHTML = '<span style="color:#8a9bab;font-size:12px;">낱개 없음</span>';
        }
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
            opt.textContent = m.name + (m.permission === 'USER' ? ' (일반)' : '');
            sel.appendChild(opt);
        });
    }

    /* ══════════════════════════════════════════
       시설 Select 채우기
    ══════════════════════════════════════════ */
    function populateFacilitySelect() {
        var sel = document.getElementById('emFacilityId');
        if (!sel) return;
        sel.innerHTML = '<option value="">없음 (독립 비품)</option>';
        state.facilities.forEach(function (f) {
            var opt = document.createElement('option');
            opt.value       = f.id;
            opt.textContent = f.name + ' (' + f.location + ')';
            opt.dataset.location = f.location;
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

        // 세트/단품 라디오 → 수량 필드 토글
        document.querySelectorAll('input[name="emIsSet"]').forEach(function (r) {
            r.addEventListener('change', toggleSetFields);
        });

        // 시리얼 모드 토글 (자동/직접)
        document.querySelectorAll('input[name="emSerialMode"]').forEach(function (r) {
            r.addEventListener('change', toggleSerialMode);
        });

        // 시설 선택 → 위치 자동 채우기
        var facilitySelEl = document.getElementById('emFacilityId');
        if (facilitySelEl) {
            facilitySelEl.addEventListener('change', function () {
                var selected = this.options[this.selectedIndex];
                var locEl = document.getElementById('emLocation');
                if (selected && selected.dataset.location && locEl && !locEl.value) {
                    locEl.value = selected.dataset.location;
                }
            });
        }

        // ── 테이블 tbody 통합 이벤트 ──────────────────────────────────
        var tbody = document.getElementById('emTableBody');
        if (!tbody) return;

        // click 이벤트
        tbody.addEventListener('click', function (e) {
            // 버튼 클릭은 별도 처리
            var btn = e.target.closest('button[data-action]');
            if (btn) {
                handleTableButtonClick(btn);
                return;
            }

            // 비품 행 클릭 → 아코디언 토글 (세트/단품 모두)
            var parentTr = e.target.closest('tr[data-id]');
            if (parentTr && !e.target.closest('.em-detail-row') && !e.target.closest('select')) {
                var equipmentId = parseInt(parentTr.dataset.id, 10);
                toggleDetailRows(equipmentId, parentTr);
            }
        });

        // change 이벤트 (낱개 상태 변경 select)
        tbody.addEventListener('change', function (e) {
            var sel = e.target.closest('select[data-action="changeDetailStatus"]');
            if (!sel) return;

            var detailId    = parseInt(sel.dataset.detailId, 10);
            var newStatus   = sel.value;
            var detailRow   = sel.closest('tr.em-detail-row');
            var equipmentId = detailRow ? parseInt(detailRow.dataset.parentId, 10) : null;

            App.fetch(App.ctx + '/equipment.do', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'updateDetailStatus', equipmentDetailId: detailId, status: newStatus }).toString()
            }).then(function (res) { return res.json(); })
              .then(function (res) {
                  if (res.success && equipmentId) {
                      // state 직접 업데이트
                      var eq = state.equipments.find(function (e) { return e.id === equipmentId; });
                      if (eq && eq.details) {
                          var d = eq.details.find(function (d) { return d.id === detailId; });
                          if (d) d.status = newStatus;
                      }
                      refreshDetailRows(equipmentId);
                  }
              })
              .catch(function () {});
        });
    }

    function handleTableButtonClick(btn) {
        var action = btn.dataset.action;

        // 비품 행 액션
        if (action === 'edit') {
            var id = parseInt(btn.dataset.id, 10);
            var eq = state.equipments.find(function (e) { return e.id === id; });
            if (eq) openModal(eq);

        } else if (action === 'delete') {
            var id = parseInt(btn.dataset.id, 10);
            showInlineConfirm(id, btn.closest('tr'));

        } else if (action === 'confirm-delete') {
            execDelete(parseInt(btn.dataset.id, 10));

        } else if (action === 'cancel-delete') {
            renderTable();

        // 낱개 행 액션
        } else if (action === 'deleteDetail') {
            if (!confirm('이 낱개를 삭제하시겠습니까?')) return;
            var detailId    = parseInt(btn.dataset.detailId, 10);
            var equipmentId = parseInt(btn.dataset.parentId, 10);
            App.fetch(App.ctx + '/equipment.do', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'deleteDetail', equipmentDetailId: detailId }).toString()
            }).then(function (res) { return res.json(); })
              .then(function (res) {
                  if (res.success) {
                      var eq = state.equipments.find(function (e) { return e.id === equipmentId; });
                      if (eq && eq.details) {
                          eq.details = eq.details.filter(function (d) { return d.id !== detailId; });
                      }
                      refreshDetailRows(equipmentId);
                  }
              })
              .catch(function () {});

        } else if (action === 'confirmAddDetail') {
            var equipmentId = parseInt(btn.dataset.parentId, 10);
            var input       = document.querySelector('.em-add-serial[data-parent-id="' + equipmentId + '"]');
            var serial      = input ? input.value.trim() : '';
            if (!serial) { if (input) input.focus(); return; }

            App.fetch(App.ctx + '/equipment.do', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'addDetail', equipmentId: equipmentId, serialNo: serial }).toString()
            }).then(function (res) { return res.json(); })
              .then(function (res) {
                  if (res.success && res.detail) {
                      var eq = state.equipments.find(function (e) { return e.id === equipmentId; });
                      if (eq) {
                          if (!eq.details) eq.details = [];
                          eq.details.push(res.detail);
                      }
                      refreshDetailRows(equipmentId);
                  }
              })
              .catch(function () {});
        }
    }

    /* ══════════════════════════════════════════
       등록·수정 모달
    ══════════════════════════════════════════ */
    function openModal(equipment) {
        var modal     = document.getElementById('equipmentModal');
        var titleEl   = document.getElementById('emModalTitle');
        var submitBtn = document.getElementById('emModalSubmit');
        if (!modal) return;

        // 초기화
        setVal('emEquipmentId', '');
        setVal('emName',        '');
        setVal('emLocation',    '');
        setVal('emSerialNo',    '');
        setVal('emManager',     '');
        setVal('emFacilityId',  '');
        setVal('emQuantity',    '');
        setRadio('emIsSet',      'false');
        setRadio('emStatus',     '정상');
        setRadio('emSerialMode', 'auto');
        toggleSetFields();
        toggleSerialMode();

        var isSetGroupEl  = document.getElementById('emIsSetGroup');
        var statusGroupEl = document.getElementById('emStatusGroup');
        var serialModeEl  = document.getElementById('emSerialModeGroup');

        if (equipment) {
            // ── 수정 모드 ──────────────────────────────────────────
            titleEl.textContent   = '비품 수정';
            submitBtn.textContent = '수정';
            state.editingId       = equipment.id;

            setVal('emEquipmentId', equipment.id);
            setVal('emName',        equipment.name       || '');
            setVal('emLocation',    equipment.location   || '');
            setVal('emSerialNo',    equipment.serialNo   || '');
            setVal('emManager',     equipment.managerId  || '');
            setVal('emFacilityId',  equipment.facilityId || '');
            setRadio('emIsSet',  equipment.isSet ? 'true' : 'false');
            setRadio('emStatus', equipment.status || '정상');

            // 수정: 유형 변경 불가, 상태 표시, 시리얼 직접 입력 모드로 고정
            if (isSetGroupEl)  isSetGroupEl.style.display  = 'none';
            if (statusGroupEl) statusGroupEl.style.display = '';
            if (serialModeEl)  serialModeEl.style.display  = 'none';
            var serialEl = document.getElementById('emSerialNo');
            if (serialEl) serialEl.style.display = '';
            var noteEl = document.getElementById('emSerialAutoNote');
            if (noteEl) noteEl.style.display = 'none';

            toggleSetFields();
        } else {
            // ── 등록 모드 ──────────────────────────────────────────
            titleEl.textContent   = '비품 등록';
            submitBtn.textContent = '등록';
            state.editingId       = null;

            if (isSetGroupEl)  isSetGroupEl.style.display  = '';
            if (statusGroupEl) statusGroupEl.style.display = 'none'; // 등록 시 상태 숨김 (항상 정상)
            if (serialModeEl)  serialModeEl.style.display  = '';
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

    function toggleSetFields() {
        var isSet     = getRadio('emIsSet') === 'true';
        var qtyGroup  = document.getElementById('emQuantityGroup');
        var serialLbl = document.getElementById('emSerialLabel');
        if (qtyGroup)  qtyGroup.style.display = isSet ? '' : 'none';
        if (serialLbl) serialLbl.textContent   = isSet ? '시리얼 접두사' : '시리얼번호';
    }

    function toggleSerialMode() {
        var isManual  = getRadio('emSerialMode') === 'manual';
        var serialEl  = document.getElementById('emSerialNo');
        var noteEl    = document.getElementById('emSerialAutoNote');
        if (serialEl) serialEl.style.display = isManual ? '' : 'none';
        if (noteEl)   noteEl.style.display   = isManual ? 'none' : '';
        if (!isManual && serialEl) serialEl.value = '';
    }

    function handleSubmit() {
        var name       = (getVal('emName')     || '').trim();
        var location   = (getVal('emLocation') || '').trim();
        var mgrId      = getVal('emManager')    || null;
        var facilityId = getVal('emFacilityId') || null;
        var isSet      = getRadio('emIsSet') === 'true';
        var quantity   = parseInt(getVal('emQuantity'), 10);
        var isEdit     = !!state.editingId;

        // 시리얼: 자동이면 빈 값으로 전송 (서버에서 자동 부여)
        var serialMode = getRadio('emSerialMode') || 'manual'; // 수정 모드는 항상 manual
        var serialNo   = (serialMode === 'manual') ? (getVal('emSerialNo') || '').trim() : '';

        // 상태: 수정 시에는 선택값, 등록 시에는 '정상' 고정
        var status = '정상';
        if (isEdit) {
            var statusEl = document.querySelector('input[name="emStatus"]:checked');
            if (statusEl) status = statusEl.value;
        }

        if (!name)                               { alert('비품명을 입력하세요.');    focusEl('emName');     return; }
        if (!location)                           { alert('보관 위치를 입력하세요.'); focusEl('emLocation'); return; }
        if (isSet && (!quantity || quantity < 1)){ alert('낱개 수량을 입력하세요.'); focusEl('emQuantity'); return; }

        var mgrObj  = mgrId ? state.managers.find(function (m) { return String(m.id) === String(mgrId); }) : null;
        var mgrName = mgrObj ? mgrObj.name : null;
        var facObj  = facilityId ? state.facilities.find(function (f) { return String(f.id) === String(facilityId); }) : null;
        var facName = facObj ? facObj.name : null;

        if (isEdit) {
            var idx = state.equipments.findIndex(function (e) { return e.id === state.editingId; });
            if (idx !== -1) {
                state.equipments[idx] = Object.assign({}, state.equipments[idx], {
                    name: name, location: location, serialNo: serialNo || state.equipments[idx].serialNo,
                    managerId: mgrId ? parseInt(mgrId, 10) : null, managerName: mgrName,
                    facilityId: facilityId ? parseInt(facilityId, 10) : null, facilityName: facName,
                    status: status
                });
            }
        } else {
            var newId = state.equipments.length > 0
                ? Math.max.apply(null, state.equipments.map(function (e) { return e.id; })) + 1 : 1000;
            state.equipments.push({
                id: newId, name: name, location: location, serialNo: serialNo || ('EQ-' + newId),
                managerId: mgrId ? parseInt(mgrId, 10) : null, managerName: mgrName,
                facilityId: facilityId ? parseInt(facilityId, 10) : null, facilityName: facName,
                isSet: isSet, status: status,
                detailCount: isSet ? quantity : 0,
                normalCount: isSet ? quantity : 0,
                issueCount: 0, details: []
            });
        }
        closeModal();
        renderStats();
        renderTable();

        var params = {
            action: isEdit ? 'update' : 'save',
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
        }).catch(function () {});
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
       유틸
    ══════════════════════════════════════════ */
    function setText(id, val)  { var el = document.getElementById(id); if (el) el.textContent = (val == null ? '' : val); }
    function setVal(id, val)   { var el = document.getElementById(id); if (el) el.value = (val == null ? '' : val); }
    function getVal(id)        { var el = document.getElementById(id); return el ? el.value : ''; }
    function focusEl(id)       { var el = document.getElementById(id); if (el) el.focus(); }
    function setRadio(name, v) { document.querySelectorAll('input[name="' + name + '"]').forEach(function(r){ r.checked = r.value === v; }); }
    function getRadio(name)    { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : null; }
    function bindClose(id, fn) { var el = document.getElementById(id); if (el) el.addEventListener('click', fn); }
    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    window.EquipmentManage = { init: init };
})();
