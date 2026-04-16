<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.kimdoolim.dto.User, com.kimdoolim.dto.Permission" %>
<%@ page import="com.kimdoolim.dto.Facility" %>
<%@ page import="java.util.List" %>
<%
    User    loginUser  = (User) session.getAttribute("loginUser");
    boolean isAdmin    = Boolean.TRUE.equals(request.getAttribute("isAdmin"));
    @SuppressWarnings("unchecked")
    List<Facility> facilities = (List<Facility>) request.getAttribute("facilities");
    if (facilities == null) facilities = java.util.Collections.emptyList();
    @SuppressWarnings("unchecked")
    List<User> managers = (List<User>) request.getAttribute("managers");
    if (managers == null) managers = java.util.Collections.emptyList();
    int colCount = isAdmin ? 8 : 7;
%>

<!-- ── SPA 데이터 브릿지 (Script 태그 대신 사용) ── -->
<div id="fmDataBridge" 
     data-is-admin="<%= isAdmin %>"
     data-user-permission="<%= request.getAttribute("userPermission") %>"
     style="display:none;">
     <script id="fmFacilitiesJson" type="application/json">
        [<%
            for (int i = 0; i < facilities.size(); i++) {
                Facility f = facilities.get(i);
                String mgrName = f.getManagerName() != null ? f.getManagerName().replace("'","\'") : "";
                String facName = f.getName()        != null ? f.getName().replace("'","\'")        : "";
                String loc     = f.getLocation()    != null ? f.getLocation().replace("'","\'")    : "";
        %>{
            "id":<%= f.getFacilityId() %>,
            "name":"<%= facName %>",
            "location":"<%= loc %>",
            "managerId":<%= f.getManagerId() != null ? f.getManagerId() : "null" %>,
            "managerName":"<%= mgrName %>",
            "capacity":<%= f.getMaxCapacity() %>,
            "maxValue":<%= f.getMaxReservationValue() %>,
            "maxUnit":"<%= f.getMaxReservationUnit() %>",
            "status":"<%= f.getStatus() %>"
        }<%= i < facilities.size() - 1 ? "," : "" %><%
            }
        %>]
     </script>
     <script id="fmManagersJson" type="application/json">
        [<%
            for (int i = 0; i < managers.size(); i++) {
                User m = managers.get(i);
                String name = m.getName() != null ? m.getName().replace("'","\'") : "";
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
        <div class="page-title">시설 관리</div>
        <div class="page-subtitle">등록된 시설 현황을 한눈에 조회하고 관리합니다.</div>
    </div>
    <% if (isAdmin) { %>
    <button class="btn-primary" id="btnAddFacility">+ 시설 등록</button>
    <% } %>
</div>

<!-- ══════════════════════════════════════════
     주의 필요 배너
══════════════════════════════════════════ -->
<div class="fm-alert-banner" id="fmAlertBanner">
    <span class="fm-alert-icon">▲</span>
    <span class="fm-alert-label">주의 필요</span>
    <div class="fm-alert-chips" id="fmAlertChips"></div>
</div>

<!-- ══════════════════════════════════════════
     요약 통계 카드 4개
══════════════════════════════════════════ -->
<div class="stat-row">
    <div class="stat-card stat-blue">
        <div class="stat-icon-wrap blue">▦</div>
        <div class="stat-body">
            <div class="stat-num" id="fmStatTotal">-</div>
            <div class="stat-lbl">전체 시설</div>
        </div>
    </div>
    <div class="stat-card stat-green">
        <div class="stat-icon-wrap green">✔</div>
        <div class="stat-body">
            <div class="stat-num" id="fmStatNormal">-</div>
            <div class="stat-lbl">정상 운영</div>
            <div class="stat-sub" id="fmStatNormalPct"></div>
        </div>
    </div>
    <div class="stat-card stat-gold">
        <div class="stat-icon-wrap gold">⚙</div>
        <div class="stat-body">
            <div class="stat-num" id="fmStatIssue">-</div>
            <div class="stat-lbl">수리·점검 중</div>
        </div>
    </div>
    <div class="stat-card stat-red">
        <div class="stat-icon-wrap red">!</div>
        <div class="stat-body">
            <div class="stat-num" id="fmStatNoMgr">-</div>
            <div class="stat-lbl">담당자 없음</div>
        </div>
    </div>
</div>

<!-- ══════════════════════════════════════════
     시설 상태 분포 바
══════════════════════════════════════════ -->
<div class="fm-status-bar-wrap">
    <div class="fm-bar-header">
        <span class="fm-bar-title">시설 상태 분포</span>
        <span class="fm-bar-total" id="fmBarTotal"></span>
    </div>
    <div class="fm-status-bar" id="fmStatusBar"></div>
    <div class="fm-bar-legend" id="fmBarLegend"></div>
</div>

<!-- ══════════════════════════════════════════
     필터 + 검색 영역
══════════════════════════════════════════ -->
<div class="fm-controls">
    <div class="fm-filter-tabs">
        <button class="fm-filter-tab active" data-filter="all">전체</button>
        <button class="fm-filter-tab" data-filter="정상">정상</button>
        <button class="fm-filter-tab" data-filter="수리">수리</button>
        <button class="fm-filter-tab" data-filter="점검">점검</button>
    </div>
    <input type="text" id="fmSearch" class="fm-search-input" placeholder="시설명, 위치, 담당자 검색...">
    <span class="fm-result-count" id="fmResultCount"></span>
</div>

<!-- ══════════════════════════════════════════
     시설 목록 테이블
══════════════════════════════════════════ -->
<div class="dash-card">
    <div class="dash-card-body">
        <table class="dash-table">
            <thead>
                <tr>
                    <th class="col-idx">#</th>
                    <th>시설명</th>
                    <th>위치</th>
                    <th>담당자</th>
                    <th class="col-num">수용인원</th>
                    <th class="col-num">최대예약</th>
                    <th class="col-status">상태</th>
                    <% if (isAdmin) { %><th class="col-manage">관리</th><% } %>
                </tr>
            </thead>
            <tbody id="fmTableBody">
                <tr><td colspan="<%= colCount %>" class="dash-empty">
                    <% if (facilities.isEmpty()) { %>
                        <% if (isAdmin) { %>등록된 시설이 없습니다.<% } else { %>관리 중인 시설이 없습니다.<% } %>
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

<!-- ── 시설 등록·수정 모달 ── -->
<div class="modal-overlay" id="facilityModal">
    <div class="modal">

        <div class="modal-header">
            <span class="modal-title" id="fmModalTitle">시설 등록</span>
            <button class="modal-close" id="fmModalClose" type="button">✕</button>
        </div>

        <div class="modal-body">
            <input type="hidden" id="fmFacilityId">

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">시설명 <span class="form-required">*</span></label>
                    <input type="text" id="fmName" class="form-input" placeholder="예: 대강당" maxlength="50">
                </div>
                <div class="form-group">
                    <label class="form-label">위치 <span class="form-required">*</span></label>
                    <input type="text" id="fmLocation" class="form-input" placeholder="예: 본관 3층" maxlength="50">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">담당자</label>
                    <select id="fmManager" class="form-select">
                        <option value="">담당자 없음</option>
                        <!-- facility-manage.js가 채움 -->
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">최대 수용인원 <span class="form-required">*</span></label>
                    <div class="form-inline">
                        <input type="number" id="fmCapacity" class="form-input" placeholder="0" min="1" max="9999">
                        <span class="form-unit">명</span>
                    </div>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">최대 예약 기간 <span class="form-required">*</span></label>
                    <div class="form-inline">
                        <input type="number" id="fmMaxValue" class="form-input" placeholder="0" min="1" max="99">
                        <select id="fmMaxUnit" class="form-select-sm">
                            <option value="일">일</option>
                            <option value="주">주</option>
                            <option value="월">월</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">상태 <span class="form-required">*</span></label>
                    <div class="form-radio-group">
                        <label class="form-radio"><input type="radio" name="fmStatus" value="정상" checked> 정상</label>
                        <label class="form-radio"><input type="radio" name="fmStatus" value="수리"> 수리</label>
                        <label class="form-radio"><input type="radio" name="fmStatus" value="점검"> 점검</label>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <button class="btn-secondary" id="fmModalCancel" type="button">취소</button>
            <button class="btn-primary"   id="fmModalSubmit" type="button">등록</button>
        </div>

    </div>
</div>

<!-- ── 담당자 재배정 모달 ── -->
<div class="modal-overlay" id="reassignModal">
    <div class="modal" style="width:380px;">

        <div class="modal-header">
            <span class="modal-title">담당자 재배정</span>
            <button class="modal-close" id="reassignModalClose" type="button">✕</button>
        </div>

        <div class="modal-body" style="padding-bottom:8px;">
            <div class="fm-reassign-target" id="reassignTargetName"></div>
            <div style="font-size:12px;color:#8a9bab;margin-bottom:12px;">재배정할 담당자를 선택하세요.</div>
            <div class="mgr-option-list" id="mgrOptionList"></div>
        </div>

        <div class="modal-footer">
            <button class="btn-secondary" id="reassignCancel" type="button">취소</button>
            <button class="btn-primary"   id="reassignSubmit" type="button">저장</button>
        </div>

    </div>
</div>

<% } %>
