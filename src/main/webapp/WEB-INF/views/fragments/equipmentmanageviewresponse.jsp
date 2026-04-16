<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.kimdoolim.dto.User, com.kimdoolim.dto.Permission" %>
<%@ page import="com.kimdoolim.dto.Equipment" %>
<%@ page import="java.util.List" %>
<%
    User    loginUser  = (User) session.getAttribute("loginUser");
    boolean isAdmin    = Boolean.TRUE.equals(request.getAttribute("isAdmin"));
    @SuppressWarnings("unchecked")
    List<Equipment> equipments = (List<Equipment>) request.getAttribute("equipments");
    if (equipments == null) equipments = java.util.Collections.emptyList();
    @SuppressWarnings("unchecked")
    List<User> managers = (List<User>) request.getAttribute("managers");
    if (managers == null) managers = java.util.Collections.emptyList();
    int colCount = isAdmin ? 8 : 7;
%>

<!-- ── SPA 데이터 브릿지 ── -->
<div id="emDataBridge"
     data-is-admin="<%= isAdmin %>"
     data-user-permission="<%= request.getAttribute("userPermission") %>"
     style="display:none;">
    <script id="emEquipmentsJson" type="application/json">
        [<%
            for (int i = 0; i < equipments.size(); i++) {
                Equipment eq = equipments.get(i);
                String mgrName  = eq.getManagerName()  != null ? eq.getManagerName().replace("\"","\\\"")  : "";
                String eqName   = eq.getName()          != null ? eq.getName().replace("\"","\\\"")          : "";
                String loc      = eq.getLocation()      != null ? eq.getLocation().replace("\"","\\\"")      : "";
                String facName  = eq.getFacilityName()  != null ? eq.getFacilityName().replace("\"","\\\"")  : "";
                String serialNo = eq.getSerialNo()      != null ? eq.getSerialNo().replace("\"","\\\"")      : "";
        %>{
            "id":<%= eq.getEquipmentId() %>,
            "name":"<%= eqName %>",
            "location":"<%= loc %>",
            "facilityId":<%= eq.getFacilityId() != null ? eq.getFacilityId() : "null" %>,
            "facilityName":"<%= facName %>",
            "managerId":<%= eq.getManagerId() != null ? eq.getManagerId() : "null" %>,
            "managerName":"<%= mgrName %>",
            "serialNo":"<%= serialNo %>",
            "status":"<%= eq.getStatus() %>"
        }<%= i < equipments.size() - 1 ? "," : "" %><%
            }
        %>]
    </script>
    <script id="emManagersJson" type="application/json">
        [<%
            for (int i = 0; i < managers.size(); i++) {
                User m = managers.get(i);
                String name = m.getName() != null ? m.getName().replace("\"","\\\"") : "";
        %>{
            "id":<%= m.getUserId() %>,
            "name":"<%= name %>"
        }<%= i < managers.size() - 1 ? "," : "" %><%
            }
        %>]
    </script>
</div>

<!-- ══════════════════════════════════════════
     페이지 헤더
══════════════════════════════════════════ -->
<div class="page-header-row">
    <div>
        <div class="page-title">비품 관리</div>
        <div class="page-subtitle">등록된 비품 현황을 한눈에 조회하고 관리합니다.</div>
    </div>
    <% if (isAdmin) { %>
    <button class="btn-primary" id="btnAddEquipment">+ 비품 등록</button>
    <% } %>
</div>

<!-- ══════════════════════════════════════════
     주의 필요 배너
══════════════════════════════════════════ -->
<div class="fm-alert-banner" id="emAlertBanner">
    <span class="fm-alert-icon">▲</span>
    <span class="fm-alert-label">주의 필요</span>
    <div class="fm-alert-chips" id="emAlertChips"></div>
</div>

<!-- ══════════════════════════════════════════
     요약 통계 카드 4개
══════════════════════════════════════════ -->
<div class="stat-row">
    <div class="stat-card stat-blue">
        <div class="stat-icon-wrap blue">▦</div>
        <div class="stat-body">
            <div class="stat-num" id="emStatTotal">-</div>
            <div class="stat-lbl">전체 비품</div>
        </div>
    </div>
    <div class="stat-card stat-green">
        <div class="stat-icon-wrap green">✔</div>
        <div class="stat-body">
            <div class="stat-num" id="emStatNormal">-</div>
            <div class="stat-lbl">정상</div>
            <div class="stat-sub" id="emStatNormalPct"></div>
        </div>
    </div>
    <div class="stat-card stat-gold">
        <div class="stat-icon-wrap gold">⚙</div>
        <div class="stat-body">
            <div class="stat-num" id="emStatIssue">-</div>
            <div class="stat-lbl">수리·점검 중</div>
        </div>
    </div>
    <div class="stat-card stat-red">
        <div class="stat-icon-wrap red">!</div>
        <div class="stat-body">
            <div class="stat-num" id="emStatNoMgr">-</div>
            <div class="stat-lbl">담당자 없음</div>
        </div>
    </div>
</div>

<!-- ══════════════════════════════════════════
     비품 상태 분포 바
══════════════════════════════════════════ -->
<div class="fm-status-bar-wrap">
    <div class="fm-bar-header">
        <span class="fm-bar-title">비품 상태 분포</span>
        <span class="fm-bar-total" id="emBarTotal"></span>
    </div>
    <div class="fm-status-bar" id="emStatusBar"></div>
    <div class="fm-bar-legend" id="emBarLegend"></div>
</div>

<!-- ══════════════════════════════════════════
     필터 + 검색
══════════════════════════════════════════ -->
<div class="fm-controls">
    <div class="fm-filter-tabs">
        <button class="fm-filter-tab active" data-filter="all">전체</button>
        <button class="fm-filter-tab" data-filter="정상">정상</button>
        <button class="fm-filter-tab" data-filter="수리">수리</button>
        <button class="fm-filter-tab" data-filter="점검">점검</button>
    </div>
    <input type="text" id="emSearch" class="fm-search-input" placeholder="비품명, 위치, 시리얼번호 검색...">
    <span class="fm-result-count" id="emResultCount"></span>
</div>

<!-- ══════════════════════════════════════════
     비품 목록 테이블
══════════════════════════════════════════ -->
<div class="dash-card">
    <div class="dash-card-body">
        <table class="dash-table">
            <thead>
                <tr>
                    <th class="col-idx">#</th>
                    <th>비품명</th>
                    <th>보관 위치</th>
                    <th>담당 시설</th>
                    <th>시리얼번호</th>
                    <th>담당자</th>
                    <th class="col-status">상태</th>
                    <% if (isAdmin) { %><th class="col-manage">관리</th><% } %>
                </tr>
            </thead>
            <tbody id="emTableBody">
                <tr><td colspan="<%= colCount %>" class="dash-empty">데이터를 불러오는 중...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<!-- ══════════════════════════════════════════
     모달 (ADMIN only)
══════════════════════════════════════════ -->
<% if (isAdmin) { %>

<!-- ── 비품 등록·수정 모달 ── -->
<div class="modal-overlay" id="equipmentModal">
    <div class="modal">

        <div class="modal-header">
            <span class="modal-title" id="emModalTitle">비품 등록</span>
            <button class="modal-close" id="emModalClose" type="button">✕</button>
        </div>

        <div class="modal-body">
            <input type="hidden" id="emEquipmentId">

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">비품명 <span class="form-required">*</span></label>
                    <input type="text" id="emName" class="form-input" placeholder="예: 노트북" maxlength="100">
                </div>
                <div class="form-group">
                    <label class="form-label">보관 위치 <span class="form-required">*</span></label>
                    <input type="text" id="emLocation" class="form-input" placeholder="예: 본관 3층 보관실" maxlength="100">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">시리얼번호</label>
                    <input type="text" id="emSerialNo" class="form-input" placeholder="예: NB-2024-001" maxlength="100">
                </div>
                <div class="form-group">
                    <label class="form-label">담당자</label>
                    <select id="emManager" class="form-select">
                        <option value="">담당자 없음</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">담당 시설 ID</label>
                    <input type="number" id="emFacilityId" class="form-input" placeholder="시설 ID (선택)" min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">상태 <span class="form-required">*</span></label>
                    <div class="form-radio-group">
                        <label class="form-radio"><input type="radio" name="emStatus" value="정상" checked> 정상</label>
                        <label class="form-radio"><input type="radio" name="emStatus" value="수리"> 수리</label>
                        <label class="form-radio"><input type="radio" name="emStatus" value="점검"> 점검</label>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <button class="btn-secondary" id="emModalCancel" type="button">취소</button>
            <button class="btn-primary"   id="emModalSubmit" type="button">등록</button>
        </div>

    </div>
</div>

<% } %>
