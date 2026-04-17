<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.kimdoolim.dto.User, com.kimdoolim.dto.Permission" %>
<%@ page import="com.kimdoolim.dto.BlockPeriod, com.kimdoolim.dto.BlockPeriodDetail" %>
<%@ page import="com.kimdoolim.dto.Facility, com.kimdoolim.dto.Equipment" %>
<%@ page import="java.util.List" %>
<%
    boolean isAdmin = Boolean.TRUE.equals(request.getAttribute("isAdmin"));
    @SuppressWarnings("unchecked")
    List<BlockPeriod> blockPeriods = (List<BlockPeriod>) request.getAttribute("blockPeriods");
    if (blockPeriods == null) blockPeriods = java.util.Collections.emptyList();
    @SuppressWarnings("unchecked")
    List<Facility> facilities = (List<Facility>) request.getAttribute("facilities");
    if (facilities == null) facilities = java.util.Collections.emptyList();
    @SuppressWarnings("unchecked")
    List<Equipment> equipments = (List<Equipment>) request.getAttribute("equipments");
    if (equipments == null) equipments = java.util.Collections.emptyList();
    int colCount = isAdmin ? 5 : 4;
%>

<!-- ── SPA 데이터 브릿지 ── -->
<div id="bpDataBridge"
     data-is-admin="<%= isAdmin %>"
     style="display:none;">
    <script id="bpPeriodsJson" type="application/json">
        [<%
            for (int i = 0; i < blockPeriods.size(); i++) {
                BlockPeriod bp = blockPeriods.get(i);
                String title = bp.getTitle() != null ? bp.getTitle().replace("\\","\\\\").replace("\"","\\\"") : "";
                String start = bp.getStartDatetime() != null ? bp.getStartDatetime() : "";
                String end   = bp.getEndDatetime()   != null ? bp.getEndDatetime()   : "";
                List<BlockPeriodDetail> dList = bp.getDetails();
        %>{
            "id":<%= bp.getBlockPeriodId() %>,
            "title":"<%= title %>",
            "startDatetime":"<%= start %>",
            "endDatetime":"<%= end %>",
            "details":[<%
                for (int j = 0; j < dList.size(); j++) {
                    BlockPeriodDetail d = dList.get(j);
                    String tName = d.getTargetName() != null ? d.getTargetName().replace("\\","\\\\").replace("\"","\\\"") : "";
            %>{
                "id":<%= d.getBlockPeriodDetailId() %>,
                "targetType":"<%= d.getTargetType() %>",
                "targetId":<%= d.getTargetId() %>,
                "targetName":"<%= tName %>"
            }<%= j < dList.size()-1 ? "," : "" %><%
                }
            %>]
        }<%= i < blockPeriods.size()-1 ? "," : "" %><%
            }
        %>]
    </script>
    <script id="bpFacilitiesJson" type="application/json">
        [<%
            for (int i = 0; i < facilities.size(); i++) {
                Facility f = facilities.get(i);
                String fName = f.getName() != null ? f.getName().replace("\\","\\\\").replace("\"","\\\"") : "";
        %>{
            "id":<%= f.getFacilityId() %>,
            "name":"<%= fName %>"
        }<%= i < facilities.size()-1 ? "," : "" %><%
            }
        %>]
    </script>
    <script id="bpEquipmentsJson" type="application/json">
        [<%
            for (int i = 0; i < equipments.size(); i++) {
                Equipment e = equipments.get(i);
                String eName = e.getName() != null ? e.getName().replace("\\","\\\\").replace("\"","\\\"") : "";
        %>{
            "id":<%= e.getEquipmentId() %>,
            "name":"<%= eName %>"
        }<%= i < equipments.size()-1 ? "," : "" %><%
            }
        %>]
    </script>
</div>

<!-- ══════════════════════════════════════════
     페이지 헤더
══════════════════════════════════════════ -->
<div class="page-header-row">
    <div>
        <div class="page-title">제한 일정 관리</div>
        <div class="page-subtitle">시설·비품 이용 제한 기간을 등록하고 관리합니다.</div>
    </div>
    <% if (isAdmin) { %>
    <button class="btn-primary" id="btnAddBlockPeriod">+ 제한 일정 등록</button>
    <% } %>
</div>

<!-- ══════════════════════════════════════════
     요약 통계 카드
══════════════════════════════════════════ -->
<div class="stat-row">
    <div class="stat-card stat-blue">
        <div class="stat-icon-wrap blue">≡</div>
        <div class="stat-body">
            <div class="stat-num" id="bpStatTotal">-</div>
            <div class="stat-lbl">전체 제한 일정</div>
        </div>
    </div>
    <div class="stat-card stat-red">
        <div class="stat-icon-wrap" style="background:#fdecea;color:#e05252;">!</div>
        <div class="stat-body">
            <div class="stat-num" id="bpStatActive">-</div>
            <div class="stat-lbl">현재 진행 중</div>
        </div>
    </div>
    <div class="stat-card stat-gold">
        <div class="stat-icon-wrap gold">▷</div>
        <div class="stat-body">
            <div class="stat-num" id="bpStatUpcoming">-</div>
            <div class="stat-lbl">예정</div>
        </div>
    </div>
    <div class="stat-card stat-green">
        <div class="stat-icon-wrap green">✔</div>
        <div class="stat-body">
            <div class="stat-num" id="bpStatPast">-</div>
            <div class="stat-lbl">종료</div>
        </div>
    </div>
</div>

<!-- ══════════════════════════════════════════
     필터 + 검색
══════════════════════════════════════════ -->
<div class="fm-controls">
    <div class="fm-filter-tabs">
        <button class="fm-filter-tab active" data-filter="all">전체</button>
        <button class="fm-filter-tab" data-filter="active">진행 중</button>
        <button class="fm-filter-tab" data-filter="upcoming">예정</button>
        <button class="fm-filter-tab" data-filter="past">종료</button>
    </div>
    <input type="text" id="bpSearch" class="fm-search-input" placeholder="제목 검색...">
    <span class="fm-result-count" id="bpResultCount"></span>
</div>

<!-- ══════════════════════════════════════════
     제한 일정 목록 테이블
══════════════════════════════════════════ -->
<div class="dash-card">
    <div class="dash-card-body">
        <table class="dash-table">
            <thead>
                <tr>
                    <th class="col-idx">#</th>
                    <th>제목</th>
                    <th>시작 일시</th>
                    <th>종료 일시</th>
                    <% if (isAdmin) { %><th class="col-manage">관리</th><% } %>
                </tr>
            </thead>
            <tbody id="bpTableBody">
                <tr><td colspan="<%= colCount %>" class="dash-empty">
                    <% if (blockPeriods.isEmpty()) { %>등록된 제한 일정이 없습니다.<% } else { %>데이터를 불러오는 중...<% } %>
                </td></tr>
            </tbody>
        </table>
    </div>
</div>

<!-- ══════════════════════════════════════════
     모달 (ADMIN only)
══════════════════════════════════════════ -->
<% if (isAdmin) { %>

<!-- ── 제한 일정 등록·수정 모달 ── -->
<div class="modal-overlay" id="blockPeriodModal">
    <div class="modal">

        <div class="modal-header">
            <span class="modal-title" id="bpModalTitle">제한 일정 등록</span>
            <button class="modal-close" id="bpModalClose" type="button">✕</button>
        </div>

        <div class="modal-body">
            <input type="hidden" id="bpBlockPeriodId">

            <div class="form-row">
                <div class="form-group" style="flex:1;">
                    <label class="form-label">제목 (사유) <span class="form-required">*</span></label>
                    <input type="text" id="bpTitle" class="form-input" placeholder="예: 하계 방학 시설 점검" maxlength="100">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">시작 날짜 <span class="form-required">*</span></label>
                    <input type="date" id="bpStartDate" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">시작 시간 <span style="font-size:11px;color:#8a9bab;">(미입력 시 00:00)</span></label>
                    <input type="time" id="bpStartTime" class="form-input">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">종료 날짜 <span class="form-required">*</span></label>
                    <input type="date" id="bpEndDate" class="form-input">
                </div>
                <div class="form-group">
                    <label class="form-label">종료 시간 <span style="font-size:11px;color:#8a9bab;">(미입력 시 23:59)</span></label>
                    <input type="time" id="bpEndTime" class="form-input">
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <button class="btn-secondary" id="bpModalCancel" type="button">취소</button>
            <button class="btn-primary"   id="bpModalSubmit" type="button">등록</button>
        </div>

    </div>
</div>

<!-- ── 대상 추가 모달 ── -->
<div class="modal-overlay" id="bpDetailModal">
    <div class="modal" style="width:400px;">

        <div class="modal-header">
            <span class="modal-title">제한 대상 추가</span>
            <button class="modal-close" id="bpDetailModalClose" type="button">✕</button>
        </div>

        <div class="modal-body">
            <input type="hidden" id="bpDetailBlockPeriodId">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">대상 유형</label>
                    <div class="form-radio-group">
                        <label class="form-radio">
                            <input type="radio" name="bpTargetType" value="FACILITY" checked> 시설
                        </label>
                        <label class="form-radio">
                            <input type="radio" name="bpTargetType" value="EQUIPMENT"> 비품
                        </label>
                    </div>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group" style="flex:1;">
                    <label class="form-label">대상 선택 <span class="form-required">*</span></label>
                    <select id="bpTargetId" class="form-select">
                        <option value="">선택하세요</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <button class="btn-secondary" id="bpDetailModalCancel" type="button">취소</button>
            <button class="btn-primary"   id="bpDetailModalSubmit" type="button">추가</button>
        </div>

    </div>
</div>

<% } %>
