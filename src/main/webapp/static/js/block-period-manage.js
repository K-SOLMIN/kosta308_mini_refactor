// ── 제한 일정 관리 페이지 ────────────────────────────────────────────
(function () {
    'use strict';

    var state = {
        periods:      [],
        facilities:   [],
        equipments:   [],
        filterStatus: 'all',
        searchText:   '',
        editingId:    null,
        isAdmin:      false,
        expanded:     {},
        fpStartDate:  '',   // range picker가 선택한 시작일 "YYYY-MM-DD"
        fpEndDate:    ''    // range picker가 선택한 종료일 "YYYY-MM-DD"
    };

    // Flatpickr 한국어 로케일 (CDN 로케일 파일 없이 인라인 정의)
    var FP_KO = {
        weekdays: {
            shorthand: ['일', '월', '화', '수', '목', '금', '토'],
            longhand:  ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
        },
        months: {
            shorthand: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
            longhand:  ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
        },
        firstDayOfWeek: 0,
        ordinal: function () { return '일'; }
    };

    var fpRange = null;

    // ── 대한민국 공휴일 ────────────────────────────────────────────
    // 고정 공휴일 (매년 동일, MM-DD 키)
    var FIXED_HOLIDAYS = {
        '01-01': '신정',
        '03-01': '삼일절',
        '05-05': '어린이날',
        '06-06': '현충일',
        '08-15': '광복절',
        '10-03': '개천절',
        '10-09': '한글날',
        '12-25': '크리스마스'
    };

    // 음력 기반 / 연도별 공휴일 (YYYY-MM-DD 키)
    var VARIABLE_HOLIDAYS = {
        /* 2024 */
        '2024-02-09':'설 연휴', '2024-02-10':'설날', '2024-02-11':'설 연휴', '2024-02-12':'대체공휴일',
        '2024-04-10':'국회의원선거',
        '2024-05-06':'대체공휴일', '2024-05-15':'부처님오신날',
        '2024-09-16':'추석 연휴', '2024-09-17':'추석', '2024-09-18':'추석 연휴',
        /* 2025 */
        '2025-01-28':'설 연휴', '2025-01-29':'설날', '2025-01-30':'설 연휴',
        '2025-05-06':'대체공휴일',
        '2025-10-05':'추석 연휴', '2025-10-06':'추석', '2025-10-07':'추석 연휴', '2025-10-08':'대체공휴일',
        /* 2026 */
        '2026-02-16':'설 연휴', '2026-02-17':'설날', '2026-02-18':'설 연휴',
        '2026-05-24':'부처님오신날',
        '2026-09-24':'추석 연휴', '2026-09-25':'추석', '2026-09-26':'추석 연휴',
        /* 2027 */
        '2027-02-06':'설 연휴', '2027-02-07':'설날', '2027-02-08':'설 연휴', '2027-02-09':'대체공휴일',
        '2027-05-13':'부처님오신날',
        '2027-10-04':'추석 연휴', '2027-10-05':'추석', '2027-10-06':'추석 연휴',
        /* 2028 */
        '2028-01-26':'설 연휴', '2028-01-27':'설날', '2028-01-28':'설 연휴',
        '2028-05-02':'부처님오신날',
        '2028-09-12':'추석 연휴', '2028-09-13':'추석', '2028-09-14':'추석 연휴'
    };

    function getHolidayName(date) {
        var y   = date.getFullYear();
        var mm  = ('0' + (date.getMonth() + 1)).slice(-2);
        var dd  = ('0' + date.getDate()).slice(-2);
        return VARIABLE_HOLIDAYS[y + '-' + mm + '-' + dd] || FIXED_HOLIDAYS[mm + '-' + dd] || null;
    }

    /* ══════════════════════════════════════════
       초기화
    ══════════════════════════════════════════ */
    function init() {
        var bridge = document.getElementById('bpDataBridge');
        if (!bridge) { console.error('[BlockPeriodManage] bridge not found'); return; }

        state.isAdmin = bridge.dataset.isAdmin === 'true';

        try {
            state.periods    = JSON.parse(document.getElementById('bpPeriodsJson').textContent    || '[]');
            state.facilities = JSON.parse(document.getElementById('bpFacilitiesJson').textContent || '[]');
            state.equipments = JSON.parse(document.getElementById('bpEquipmentsJson').textContent || '[]');
        } catch (e) {
            console.error('[BlockPeriodManage] JSON parse error:', e);
            state.periods = []; state.facilities = []; state.equipments = [];
        }

        initFlatpickr();
        renderStats();
        renderTable();
        setupListeners();
    }

    /* ══════════════════════════════════════════
       Flatpickr 초기화
    ══════════════════════════════════════════ */
    function initFlatpickr() {
        if (typeof flatpickr === 'undefined') return;

        // 날짜 셀 생성 콜백: 주말 + 공휴일 처리
        function onDayCreate(dObj, dStr, fp, dayElem) {
            var date = dayElem.dateObj;
            if (!date) return;
            var dow = date.getDay(); // 0=일, 6=토
            if (dow === 0 || dow === 6) dayElem.classList.add('fp-weekend');
            if (getHolidayName(date)) dayElem.classList.add('fp-holiday');
        }

        // 1. 기간 선택 (날짜)
        fpRange = flatpickr('#bpDateRange', {
            locale:            FP_KO,
            mode:              'range',
            showMonths:        2,
            monthSelectorType: 'dropdown',
            animate:           false,
            dateFormat:        'Y-m-d',
            disableMobile:     true,
            allowInput:        false,
            minDate:           'today',
            onDayCreate:       onDayCreate,
            onChange: function (selectedDates) {
                var start = selectedDates[0] || null;
                var end   = selectedDates[1] || null;
                state.fpStartDate = start ? fmtDate(start) : '';
                state.fpEndDate   = end   ? fmtDate(end)   : '';
                updateRangeDisplay(state.fpStartDate, state.fpEndDate);
            }
        });

        // 2. 시간 선택 (시작)
        flatpickr('#bpStartTime', {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr:  true,
            disableMobile: true
        });

        // 3. 시간 선택 (종료)
        flatpickr('#bpEndTime', {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr:  true,
            disableMobile: true
        });

        // 표시 박스 클릭 시 달력 오픈
        var display = document.getElementById('bpRangeDisplay');
        if (display) display.addEventListener('click', function () {
            if (fpRange) fpRange.open();
        });
    }

    // Date → "YYYY-MM-DD"
    function fmtDate(date) {
        var y = date.getFullYear();
        var m = ('0' + (date.getMonth() + 1)).slice(-2);
        var d = ('0' + date.getDate()).slice(-2);
        return y + '-' + m + '-' + d;
    }

    // 범위 표시 박스 업데이트
    function updateRangeDisplay(start, end) {
        var sEl = document.getElementById('bpStartVal');
        var eEl = document.getElementById('bpEndVal');
        if (sEl) { sEl.textContent = start || '날짜 선택'; sEl.classList.toggle('empty', !start); }
        if (eEl) { eEl.textContent = end   || '날짜 선택'; eEl.classList.toggle('empty', !end); }
    }

    /* ══════════════════════════════════════════
       상태 판별 (현재 시각 기준)
    ══════════════════════════════════════════ */
    function getPeriodStatus(p) {
        var now   = new Date();
        var start = new Date(p.startDatetime.replace(' ', 'T'));
        var end   = new Date(p.endDatetime.replace(' ', 'T'));
        if (now < start) return 'upcoming';
        if (now > end)   return 'past';
        return 'active';
    }

    /* ══════════════════════════════════════════
       통계 카드
    ══════════════════════════════════════════ */
    function renderStats() {
        var total    = state.periods.length;
        var active   = state.periods.filter(function(p){ return getPeriodStatus(p) === 'active';   }).length;
        var upcoming = state.periods.filter(function(p){ return getPeriodStatus(p) === 'upcoming'; }).length;
        var past     = state.periods.filter(function(p){ return getPeriodStatus(p) === 'past';     }).length;

        setText('bpStatTotal',    total);
        setText('bpStatActive',   active);
        setText('bpStatUpcoming', upcoming);
        setText('bpStatPast',     past);
    }

    /* ══════════════════════════════════════════
       테이블 렌더링
    ══════════════════════════════════════════ */
    function renderTable() {
        var tbody = document.getElementById('bpTableBody');
        if (!tbody) return;

        state.expanded = {};
        var filtered = getFiltered();
        var colSpan  = state.isAdmin ? 5 : 4;

        setText('bpResultCount', filtered.length + '개 일정');

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="' + colSpan + '" class="dash-empty">' +
                (state.periods.length === 0 ? '등록된 제한 일정이 없습니다.' : '조건에 맞는 일정이 없습니다.') +
                '</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function (p, i) {
            var st       = getPeriodStatus(p);
            var stBadge  = statusBadge(st);
            var nameCell = '<span class="em-expand-icon" data-id="' + p.id + '">▶</span> ' + esc(p.title);
            var manage   = '';
            if (state.isAdmin) {
                manage = '<td class="fm-manage-cell">' +
                    '<button class="btn-tbl-edit" data-action="edit"   data-id="' + p.id + '">수정</button>' +
                    '<button class="btn-tbl-del"  data-action="delete" data-id="' + p.id + '">삭제</button>' +
                    '</td>';
            }
            return '<tr data-id="' + p.id + '" class="em-row-set">'
                + '<td class="col-idx">' + (i + 1) + '</td>'
                + '<td class="td-name">' + nameCell + ' ' + stBadge + '</td>'
                + '<td>' + formatDatetime(p.startDatetime) + '</td>'
                + '<td>' + formatDatetime(p.endDatetime)   + '</td>'
                + manage
                + '</tr>';
        }).join('');
    }

    function getFiltered() {
        var kw = state.searchText.toLowerCase();
        return state.periods.filter(function (p) {
            var f = state.filterStatus;
            if (f !== 'all' && getPeriodStatus(p) !== f) return false;
            if (!kw) return true;
            return (p.title || '').toLowerCase().indexOf(kw) >= 0;
        });
    }

    function statusBadge(st) {
        var map = { active: 'waiting', upcoming: 'inspection', past: 'approved' };
        var label = { active: '진행 중', upcoming: '예정', past: '종료' };
        return '<span class="status-badge ' + (map[st] || '') + '">' + (label[st] || st) + '</span>';
    }

    /* ══════════════════════════════════════════
       아코디언: 대상 목록 펼침/접기
    ══════════════════════════════════════════ */
    function toggleDetailRows(periodId, parentTr) {
        if (state.expanded[periodId]) collapseDetailRows(periodId, parentTr);
        else                          expandDetailRows(periodId, parentTr);
    }

    function collapseDetailRows(periodId, parentTr) {
        state.expanded[periodId] = false;
        var icon = parentTr.querySelector('.em-expand-icon');
        if (icon) icon.textContent = '▶';
        parentTr.classList.remove('em-row-expanded');
        removeDetailRows(periodId);
    }

    function removeDetailRows(periodId) {
        var tbody = document.getElementById('bpTableBody');
        if (!tbody) return;
        tbody.querySelectorAll('tr.em-detail-row[data-parent-id="' + periodId + '"]')
             .forEach(function (r) { r.remove(); });
    }

    function expandDetailRows(periodId, parentTr) {
        state.expanded[periodId] = true;
        var icon = parentTr.querySelector('.em-expand-icon');
        if (icon) icon.textContent = '▼';
        parentTr.classList.add('em-row-expanded');

        var p       = state.periods.find(function (x) { return x.id === periodId; });
        var details = p ? (p.details || []) : [];
        insertDetailRows(periodId, parentTr, details);
    }

    function refreshDetailRows(periodId) {
        if (!state.expanded[periodId]) return;
        var parentTr = document.querySelector('#bpTableBody tr[data-id="' + periodId + '"]');
        if (!parentTr) return;
        removeDetailRows(periodId);
        var p = state.periods.find(function (x) { return x.id === periodId; });
        if (!p) return;
        insertDetailRows(periodId, parentTr, p.details || []);
    }

    function insertDetailRows(periodId, parentTr, details) {
        var colSpan = state.isAdmin ? 5 : 4;

        if (details.length === 0) {
            var emptyTr = makeDetailRow(periodId,
                '<td colspan="' + colSpan + '" style="text-align:center;color:#8a9bab;font-size:12px;padding:10px;">등록된 대상이 없습니다.</td>');
            parentTr.after(emptyTr);
            if (state.isAdmin) appendAddDetailRow(periodId, emptyTr);
            return;
        }

        var insertRef = parentTr;
        details.forEach(function (d, i) {
            var typeLabel = d.targetType === 'FACILITY' ? '시설' : '비품';
            var typeCls   = d.targetType === 'FACILITY' ? 'facility' : 'equipment';
            var manageHtml = state.isAdmin
                ? '<button class="btn-tbl-del" style="font-size:11px;" ' +
                  'data-action="deleteDetail" data-detail-id="' + d.id + '" data-parent-id="' + periodId + '">삭제</button>'
                : '-';

            var tr = makeDetailRow(periodId,
                '<td style="border-left:3px solid #d0e4f7;"></td>' +
                '<td colspan="2" class="em-detail-indent">↳ ' +
                    '<span class="type-badge ' + typeCls + '" style="font-size:11px;">' + typeLabel + '</span> ' +
                    esc(d.targetName || '-') +
                '</td>' +
                '<td></td>' +
                (state.isAdmin ? '<td class="fm-manage-cell">' + manageHtml + '</td>' : '')
            );
            tr.dataset.detailId = d.id;
            insertRef.after(tr);
            insertRef = tr;
        });

        if (state.isAdmin) appendAddDetailRow(periodId, insertRef);
    }

    function appendAddDetailRow(periodId, insertRef) {
        var addTr = makeDetailRow(periodId,
            '<td style="border-left:3px solid #d0e4f7;"></td>' +
            '<td colspan="3" class="em-detail-indent" style="color:#52a3f5;font-size:12px;">+ 대상 추가</td>' +
            (state.isAdmin
                ? '<td class="fm-manage-cell">' +
                  '<button class="btn-tbl-edit" style="font-size:11px;" ' +
                  'data-action="openAddDetail" data-parent-id="' + periodId + '">추가</button></td>'
                : '')
        );
        addTr.classList.add('em-detail-add-row');
        insertRef.after(addTr);
    }

    function makeDetailRow(periodId, innerHtml) {
        var tr = document.createElement('tr');
        tr.className        = 'em-detail-row';
        tr.dataset.parentId = periodId;
        tr.innerHTML        = innerHtml;
        return tr;
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
        var searchEl = document.getElementById('bpSearch');
        if (searchEl) searchEl.addEventListener('input', function () { state.searchText = this.value; renderTable(); });

        // 등록 버튼
        var addBtn = document.getElementById('btnAddBlockPeriod');
        if (addBtn) addBtn.addEventListener('click', function () { openModal(null); });

        // 모달 닫기
        bindClose('bpModalClose',  closeModal);
        bindClose('bpModalCancel', closeModal);
        var modal = document.getElementById('blockPeriodModal');
        if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

        // 모달 제출
        var submitBtn = document.getElementById('bpModalSubmit');
        if (submitBtn) submitBtn.addEventListener('click', handleSubmit);

        // 대상 추가 모달 닫기
        bindClose('bpDetailModalClose',  closeDetailModal);
        bindClose('bpDetailModalCancel', closeDetailModal);
        var detailModal = document.getElementById('bpDetailModal');
        if (detailModal) detailModal.addEventListener('click', function (e) { if (e.target === detailModal) closeDetailModal(); });

        // 대상 유형 라디오 → select 갱신
        document.querySelectorAll('input[name="bpTargetType"]').forEach(function (r) {
            r.addEventListener('change', populateTargetSelect);
        });

        // 대상 추가 모달 제출
        var detailSubmit = document.getElementById('bpDetailModalSubmit');
        if (detailSubmit) detailSubmit.addEventListener('click', handleAddDetail);

        // 테이블 통합 이벤트
        var tbody = document.getElementById('bpTableBody');
        if (!tbody) return;

        tbody.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-action]');
            if (btn) { handleTableButtonClick(btn); return; }

            var parentTr = e.target.closest('tr[data-id]');
            if (parentTr && !e.target.closest('.em-detail-row') && !e.target.closest('select')) {
                toggleDetailRows(parseInt(parentTr.dataset.id, 10), parentTr);
            }
        });
    }

    function handleTableButtonClick(btn) {
        var action = btn.dataset.action;

        if (action === 'edit') {
            var id = parseInt(btn.dataset.id, 10);
            var p  = state.periods.find(function (x) { return x.id === id; });
            if (p) openModal(p);

        } else if (action === 'delete') {
            var id = parseInt(btn.dataset.id, 10);
            showInlineConfirm(id, btn.closest('tr'));

        } else if (action === 'confirm-delete') {
            execDelete(parseInt(btn.dataset.id, 10));

        } else if (action === 'cancel-delete') {
            renderTable();

        } else if (action === 'openAddDetail') {
            var periodId = parseInt(btn.dataset.parentId, 10);
            openDetailModal(periodId);

        } else if (action === 'deleteDetail') {
            if (!confirm('이 대상을 삭제하시겠습니까?')) return;
            var detailId = parseInt(btn.dataset.detailId, 10);
            var periodId = parseInt(btn.dataset.parentId, 10);
            App.fetch(App.ctx + '/blockperiod.do', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'deleteDetail', blockPeriodDetailId: detailId }).toString()
            }).then(function (res) { return res.json(); })
              .then(function (res) {
                  if (res.success) {
                      var p = state.periods.find(function (x) { return x.id === periodId; });
                      if (p && p.details) {
                          p.details = p.details.filter(function (d) { return d.id !== detailId; });
                      }
                      refreshDetailRows(periodId);
                  }
              }).catch(function () {});
        }
    }

    /* ══════════════════════════════════════════
       등록·수정 모달
    ══════════════════════════════════════════ */
    function openModal(period) {
        var modal     = document.getElementById('blockPeriodModal');
        var titleEl   = document.getElementById('bpModalTitle');
        var submitBtn = document.getElementById('bpModalSubmit');
        if (!modal) return;

        setVal('bpBlockPeriodId', '');
        setVal('bpTitle',         '');
        setVal('bpStartTime',     '');
        setVal('bpEndTime',       '');
        state.fpStartDate = '';
        state.fpEndDate   = '';
        if (fpRange) fpRange.clear();
        updateRangeDisplay('', '');

        if (period) {
            titleEl.textContent   = '제한 일정 수정';
            submitBtn.textContent = '수정';
            state.editingId       = period.id;

            setVal('bpBlockPeriodId', period.id);
            setVal('bpTitle',         period.title || '');

            // "yyyy-MM-dd HH:mm:ss" → date / time 분리
            var sParts = splitDatetime(period.startDatetime);
            var eParts = splitDatetime(period.endDatetime);

            state.fpStartDate = sParts.date;
            state.fpEndDate   = eParts.date;
            if (fpRange) fpRange.setDate([sParts.date, eParts.date], false);
            updateRangeDisplay(sParts.date, eParts.date);

            setVal('bpStartTime', sParts.time === '00:00' ? '' : sParts.time);
            setVal('bpEndTime',   eParts.time === '23:59' ? '' : eParts.time);
        } else {
            titleEl.textContent   = '제한 일정 등록';
            submitBtn.textContent = '등록';
            state.editingId       = null;
        }

        modal.style.display = 'flex';
        focusEl('bpTitle');
    }

    function closeModal() {
        var modal = document.getElementById('blockPeriodModal');
        if (modal) modal.style.display = 'none';
        if (fpRange) fpRange.close();
        state.editingId   = null;
        state.fpStartDate = '';
        state.fpEndDate   = '';
    }

    function handleSubmit() {
        var title     = (getVal('bpTitle')     || '').trim();
        var startDate = state.fpStartDate;
        var endDate   = state.fpEndDate;
        var startTime = (getVal('bpStartTime') || '').trim();
        var endTime   = (getVal('bpEndTime')   || '').trim();
        var isEdit    = !!state.editingId;

        if (!title)     { alert('제목을 입력하세요.');                  focusEl('bpTitle'); return; }
        if (!startDate || !endDate) {
            alert('제한 기간을 선택하세요.');
            if (fpRange) fpRange.open();
            return;
        }

        // 날짜/시간 조합
        var startDatetime = startDate + ' ' + (startTime ? startTime + ':00' : '00:00:00');
        var endDatetime   = endDate   + ' ' + (endTime   ? endTime   + ':00' : '23:59:59');

        if (new Date(startDatetime.replace(' ','T')) >= new Date(endDatetime.replace(' ','T'))) {
            alert('종료 일시는 시작 일시보다 이후여야 합니다.');
            return;
        }

        var params = {
            action:        isEdit ? 'update' : 'save',
            title:         title,
            startDate:     startDate,
            startTime:     startTime,
            endDate:       endDate,
            endTime:       endTime
        };
        if (isEdit) params.blockPeriodId = state.editingId;

        // 낙관적 UI 업데이트
        if (isEdit) {
            var idx = state.periods.findIndex(function (p) { return p.id === state.editingId; });
            if (idx !== -1) {
                state.periods[idx] = Object.assign({}, state.periods[idx], {
                    title: title, startDatetime: startDatetime, endDatetime: endDatetime
                });
            }
        } else {
            var newId = state.periods.length > 0
                ? Math.max.apply(null, state.periods.map(function (p) { return p.id; })) + 1 : 1;
            state.periods.unshift({
                id: newId, title: title,
                startDatetime: startDatetime, endDatetime: endDatetime,
                details: []
            });
        }

        closeModal();
        renderStats();
        renderTable();

        App.fetch(App.ctx + '/blockperiod.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(params).toString()
        }).catch(function () {});
    }

    /* ══════════════════════════════════════════
       대상 추가 모달
    ══════════════════════════════════════════ */
    function openDetailModal(periodId) {
        var modal = document.getElementById('bpDetailModal');
        if (!modal) return;
        setVal('bpDetailBlockPeriodId', periodId);
        setRadio('bpTargetType', 'FACILITY');
        populateTargetSelect();
        modal.style.display = 'flex';
    }

    function closeDetailModal() {
        var modal = document.getElementById('bpDetailModal');
        if (modal) modal.style.display = 'none';
    }

    function populateTargetSelect() {
        var sel  = document.getElementById('bpTargetId');
        if (!sel) return;
        var type = getRadio('bpTargetType') || 'FACILITY';
        var list = type === 'FACILITY' ? state.facilities : state.equipments;
        sel.innerHTML = '<option value="">선택하세요</option>';
        list.forEach(function (item) {
            var opt = document.createElement('option');
            opt.value       = item.id;
            opt.textContent = item.name;
            sel.appendChild(opt);
        });
    }

    function handleAddDetail() {
        var periodId   = parseInt(getVal('bpDetailBlockPeriodId'), 10);
        var targetType = getRadio('bpTargetType') || 'FACILITY';
        var targetId   = getVal('bpTargetId');
        if (!targetId) { alert('대상을 선택하세요.'); return; }

        var list     = targetType === 'FACILITY' ? state.facilities : state.equipments;
        var target   = list.find(function (x) { return String(x.id) === String(targetId); });
        var tName    = target ? target.name : '';

        App.fetch(App.ctx + '/blockperiod.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'addDetail',
                blockPeriodId: periodId,
                targetType:    targetType,
                targetId:      targetId
            }).toString()
        }).then(function (res) { return res.json(); })
          .then(function (res) {
              if (res.success && res.detail) {
                  var p = state.periods.find(function (x) { return x.id === periodId; });
                  if (p) {
                      if (!p.details) p.details = [];
                      p.details.push({
                          id:         res.detail.id,
                          targetType: res.detail.targetType,
                          targetId:   res.detail.targetId,
                          targetName: res.detail.targetName || tName
                      });
                  }
                  closeDetailModal();
                  refreshDetailRows(periodId);
              } else {
                  alert('추가에 실패했습니다.');
              }
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
        state.periods = state.periods.filter(function (p) { return p.id !== id; });
        renderStats();
        renderTable();
        App.fetch(App.ctx + '/blockperiod.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'delete', blockPeriodId: id }).toString()
        }).catch(function () {});
    }

    /* ══════════════════════════════════════════
       유틸
    ══════════════════════════════════════════ */
    function formatDatetime(dt) {
        if (!dt) return '-';
        // "yyyy-MM-dd HH:mm:ss" 형식
        var parts = dt.split(' ');
        var date  = parts[0] || '';
        var time  = (parts[1] || '').substring(0, 5); // HH:mm
        if (time === '00:00' && dt.indexOf('00:00:00') !== -1) return date + ' (종일 시작)';
        if (time === '23:59')                                   return date + ' (종일 종료)';
        return date + ' ' + time;
    }

    function splitDatetime(dt) {
        if (!dt) return { date: '', time: '' };
        var parts = dt.split(' ');
        return { date: parts[0] || '', time: (parts[1] || '').substring(0, 5) };
    }

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

    window.BlockPeriodManage = { init: init };
})();
