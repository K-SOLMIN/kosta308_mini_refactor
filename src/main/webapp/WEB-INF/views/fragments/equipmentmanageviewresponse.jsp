<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.kimdoolim.dto.User, com.kimdoolim.dto.Permission" %>
<%@ page import="com.kimdoolim.dto.Equipment, com.kimdoolim.dto.EquipmentDetail" %>
<%@ page import="com.kimdoolim.dto.Facility" %>
<%@ page import="java.util.List" %>
<%
    boolean isAdmin = Boolean.TRUE.equals(request.getAttribute("isAdmin"));

    @SuppressWarnings("unchecked")
    List<Equipment> equipments = (List<Equipment>) request.getAttribute("equipments");
    if (equipments == null) equipments = java.util.Collections.emptyList();
    
    @SuppressWarnings("unchecked")
    List<User> managers = (List<User>) request.getAttribute("managers");
    if (managers == null) managers = java.util.Collections.emptyList();
    
    @SuppressWarnings("unchecked")
    List<Facility> facilities = (List<Facility>) request.getAttribute("facilities");
    if (facilities == null) facilities = java.util.Collections.emptyList();
    int colCount = isAdmin ? 9 : 8;
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
            "status":"<%= eq.getStatus() %>",
            "isSet":<%= eq.isSet() %>,
            "detailCount":<%= eq.getDetailCount() %>,
            "normalCount":<%= eq.getNormalCount() %>,
            "issueCount":<%= eq.getIssueCount() %>,
            "details":[<%
                List<EquipmentDetail> dList = eq.getDetails();
                for (int j = 0; j < dList.size(); j++) {
                    EquipmentDetail d = dList.get(j);
                    String dSerial = d.getSerialNo() != null ? d.getSerialNo().replace("\"","\\\"") : "";
                    %>{
                        "id":<%= d.getEquipmentDetailId() %>,
                        "serialNo":"<%= dSerial %>",
                        "status":"<%= d.getStatus() %>"
                    }<%= j < dList.size() - 1 ? "," : "" %><%
                }
            %>]
        }<%= i < equipments.size() - 1 ? "," : "" %><%
            }
        %>]
    </script>
    <script id="emManagersJson" type="application/json">
        [<%
            for (int i = 0; i < managers.size(); i++) {
                User m = managers.get(i);
                String name = m.getName() != null ? m.getName().replace("\"","\\\"") : "";
                String perm = m.getPermission() != null ? m.getPermission().name() : "USER";
        %>{
            "id":<%= m.getUserId() %>,
            "name":"<%= name %>",
            "permission":"<%= perm %>"
        }<%= i < managers.size() - 1 ? "," : "" %><%
            }
        %>]
    </script>
    <script id="emFacilitiesJson" type="application/json">
        [<%
            for (int i = 0; i < facilities.size(); i++) {
                Facility fac = facilities.get(i);
                String facName = fac.getName()     != null ? fac.getName().replace("\"","\\\"")     : "";
                String facLoc  = fac.getLocation() != null ? fac.getLocation().replace("\"","\\\"") : "";
        %>{
            "id":<%= fac.getFacilityId() %>,
            "name":"<%= facName %>",
            "location":"<%= facLoc %>"
        }<%= i < facilities.size() - 1 ? "," : "" %><%
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
        <div class="page-subtitle">비품 세트·단품 현황을 조회하고, 낱개 단위로 관리합니다.</div>
    </div>
    <% if (isAdmin) { %>
    <button class="btn-primary" id="btnAddEquipment">+ 비품 등록</button>
    <% } %>
</div>

<!-- ══════════════════════════════════════════
     주의 필요 배너
══════════════════════════════════════════ -->
<div class="fm-alert-banner" id="emAlertBanner" style="display:none;">
    <span class="fm-alert-icon">▲</span>
    <span class="fm-alert-label">주의 필요</span>
    <div class="fm-alert-chips" id="emAlertChips"></div>
</div>

<!-- ══════════════════════════════════════════
     요약 통계 카드
══════════════════════════════════════════ -->
<div class="stat-row">
    <div class="stat-card stat-blue">
        <div class="stat-icon-wrap blue">▦</div>
        <div class="stat-body">
            <div class="stat-num" id="emStatTotal">-</div>
            <div class="stat-lbl">전체 비품 종류</div>
        </div>
    </div>
    <div class="stat-card stat-green">
        <div class="stat-icon-wrap green">▣</div>
        <div class="stat-body">
            <div class="stat-num" id="emStatSet">-</div>
            <div class="stat-lbl">세트 비품</div>
            <div class="stat-sub" id="emStatSetSub"></div>
        </div>
    </div>
    <div class="stat-card stat-gold">
        <div class="stat-icon-wrap gold">◻</div>
        <div class="stat-body">
            <div class="stat-num" id="emStatSingle">-</div>
            <div class="stat-lbl">단품 비품</div>
        </div>
    </div>
    <div class="stat-card stat-red">
        <div class="stat-icon-wrap red">!</div>
        <div class="stat-body">
            <div class="stat-num" id="emStatIssue">-</div>
            <div class="stat-lbl">이슈 비품</div>
            <div class="stat-sub" id="emStatIssueSub"></div>
        </div>
    </div>
</div>

<!-- ══════════════════════════════════════════
     상태 분포 바
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
        <button class="fm-filter-tab" data-filter="set">세트</button>
        <button class="fm-filter-tab" data-filter="single">단품</button>
        <button class="fm-filter-tab" data-filter="정상">정상</button>
        <button class="fm-filter-tab" data-filter="issue">이슈</button>
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
                    <th style="width:54px;">유형</th>
                    <th>비품명</th>
                    <th>보관 위치</th>
                    <th>담당 시설</th>
                    <th style="width:150px;">수량 / 시리얼</th>
                    <th>담당자</th>
                    <th class="col-status">상태</th>
                    <% if (isAdmin) { %><th class="col-manage">관리</th><% } %>
                </tr>
            </thead>
            <tbody id="emTableBody">
                <tr><td colspan="<%= colCount %>" class="dash-empty">
                    <% if (equipments.isEmpty()) { %>
                        <% if (isAdmin) { %>등록된 비품이 없습니다.<% } else { %>관리 가능한 비품이 없습니다.<% } %>
                    <% } else { %>데이터를 불러오는 중...<% } %>
                </td></tr>
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

            <!-- 비품 유형 (등록 시에만 변경 가능) -->
            <div class="form-group" style="margin-bottom:16px;" id="emIsSetGroup">
                <label class="form-label">비품 유형</label>
                <div class="form-radio-group">
                    <label class="form-radio"><input type="radio" name="emIsSet" value="false" checked> 단품 (개별 1개)</label>
                    <label class="form-radio"><input type="radio" name="emIsSet" value="true"> 세트 (낱개 여러 개)</label>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">비품명 <span class="form-required">*</span></label>
                    <input type="text" id="emName" class="form-input" placeholder="예: 노트북" maxlength="100">
                </div>
                <div class="form-group">
                    <label class="form-label">담당 시설</label>
                    <select id="emFacilityId" class="form-select">
                        <option value="">없음 (독립 비품)</option>
                        <!-- equipment-manage.js가 채움 -->
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">보관 위치 <span class="form-required">*</span></label>
                    <input type="text" id="emLocation" class="form-input" placeholder="시설 선택 시 자동 입력" maxlength="100">
                </div>
                <div class="form-group">
                    <label class="form-label">담당자</label>
                    <select id="emManager" class="form-select">
                        <option value="">담당자 없음</option>
                    </select>
                </div>
            </div>

            <!-- 시리얼번호 -->
            <div class="form-group" id="emSerialGroup">
                <label class="form-label" id="emSerialLabel">시리얼번호</label>
                <div class="form-radio-group" style="margin-bottom:6px;" id="emSerialModeGroup">
                    <label class="form-radio"><input type="radio" name="emSerialMode" value="auto" checked> 자동 부여</label>
                    <label class="form-radio"><input type="radio" name="emSerialMode" value="manual"> 직접 입력</label>
                </div>
                <input type="text" id="emSerialNo" class="form-input" placeholder="예: NB-2024-001" maxlength="100" style="display:none;">
                <div id="emSerialAutoNote" style="font-size:11px;color:#8a9bab;">저장 시 자동으로 시리얼번호가 부여됩니다.</div>
            </div>

            <!-- 세트 등록 시에만 표시 -->
            <div class="form-group" id="emQuantityGroup" style="display:none;">
                <label class="form-label">낱개 수량 <span class="form-required">*</span></label>
                <div class="form-inline">
                    <input type="number" id="emQuantity" class="form-input" placeholder="예: 5" min="1" max="999">
                    <span class="form-unit">개</span>
                </div>
                <div style="font-size:11px;color:#8a9bab;margin-top:4px;">시리얼접두사-001 ~ 접두사-N 형식으로 낱개 자동 생성</div>
            </div>

            <!-- 상태 (수정 시에만 표시) -->
            <div class="form-group" id="emStatusGroup" style="display:none;">
                <label class="form-label">상태</label>
                <div class="form-radio-group">
                    <label class="form-radio"><input type="radio" name="emStatus" value="정상" checked> 정상</label>
                    <label class="form-radio"><input type="radio" name="emStatus" value="수리"> 수리</label>
                    <label class="form-radio"><input type="radio" name="emStatus" value="점검"> 점검</label>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" id="emModalCancel" type="button">취소</button>
            <button class="btn-primary"   id="emModalSubmit" type="button">등록</button>
        </div>
    </div>
</div>

<!-- ── 낱개 상세 모달 ── -->
<div class="modal-overlay" id="detailModal">
    <div class="modal" style="width:600px;max-width:96vw;">
        <div class="modal-header">
            <span class="modal-title" id="detailModalTitle">낱개 목록</span>
            <button class="modal-close" id="detailModalClose" type="button">✕</button>
        </div>
        <div class="modal-body" style="padding-bottom:8px;">
            <!-- 낱개 상태 요약 -->
            <div id="detailStatRow" style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap;"></div>
            <!-- 낱개 추가 입력 -->
            <div id="detailAddRow" style="display:flex;gap:8px;margin-bottom:12px;align-items:center;">
                <input type="text" id="detailNewSerial" class="form-input" placeholder="추가할 시리얼번호" style="flex:1;margin:0;">
                <button class="btn-primary" id="detailAddBtn" type="button" style="white-space:nowrap;">+ 낱개 추가</button>
            </div>
            <!-- 낱개 목록 테이블 -->
            <div style="max-height:360px;overflow-y:auto;">
                <table class="dash-table" id="detailTable">
                    <thead>
                        <tr>
                            <th class="col-idx">#</th>
                            <th>시리얼 번호</th>
                            <th class="col-status">상태</th>
                            <th class="col-manage">관리</th>
                        </tr>
                    </thead>
                    <tbody id="detailTableBody">
                        <tr><td colspan="4" class="dash-empty">불러오는 중...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" id="detailModalClose2" type="button">닫기</button>
        </div>
    </div>
</div>

<% } %>
