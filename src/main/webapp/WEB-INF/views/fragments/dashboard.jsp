<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.kimdoolim.dto.User" %>
<%@ page import="com.kimdoolim.dto.Permission" %>
<%
    User loginUser = (User) session.getAttribute("loginUser");
    boolean isActive      = loginUser != null && loginUser.isActive();
    boolean isMiddleAdmin = loginUser != null && (loginUser.getPermission() == Permission.MIDDLEADMIN
                         || loginUser.getPermission() == Permission.ADMIN);
    String statusLabel = loginUser != null ? loginUser.getUserStatus().name() : "";
%>

        <div class="page-title">대시보드</div>
        <div class="page-subtitle"><%= loginUser != null ? loginUser.getName() : "" %>님, 안녕하세요.</div>

        <% if (!isActive) { %>
        <div class="inactive-banner">
            <strong>⚠ 계정이 비활성 상태입니다 (<%= statusLabel %>)</strong><br>
            예약하기, 알림 등 일부 기능 이용이 제한됩니다. 이용 문의는 시스템 관리자에게 연락하세요.
        </div>
        <% } %>

        <!-- ── 요약 통계 카드 ── -->
        <div class="stat-row">
            <div class="stat-card stat-blue">
                <div class="stat-icon-wrap blue">≡</div>
                <div class="stat-body">
                    <div class="stat-num" id="statWeekCount">-</div>
                    <div class="stat-lbl">이번 주 내 예약</div>
                </div>
            </div>
            <div class="stat-card stat-gold">
                <div class="stat-icon-wrap gold">◐</div>
                <div class="stat-body">
                    <div class="stat-num" id="statPendingCount">-</div>
                    <div class="stat-lbl">대기 중</div>
                </div>
            </div>
            <div class="stat-card stat-green">
                <div class="stat-icon-wrap green">✔</div>
                <div class="stat-body">
                    <div class="stat-num" id="statApprovedCount">-</div>
                    <div class="stat-lbl">승인됨</div>
                </div>
            </div>
            <div class="stat-card stat-red">
                <div class="stat-icon-wrap red">◉</div>
                <div class="stat-body">
                    <div class="stat-num" id="statAlarmCount">-</div>
                    <div class="stat-lbl">미읽 알림</div>
                </div>
            </div>
        </div>

        <div class="dash-grid">

            <!-- ── 왼쪽: 테이블 영역 ── -->
            <div class="dash-left">

                <!-- 나의 예약 내역 -->
                <div class="dash-card">
                    <div class="dash-card-header">
                        <span class="dash-card-title">나의 예약 내역</span>
                        <span class="dash-card-sub">예약 시작일 오름차순 · 최대 7건</span>
                    </div>
                    <div class="dash-card-body">
                        <table class="dash-table">
                            <thead>
                                <tr>
                                    <th>구분</th>
                                    <th>시설·비품명</th>
                                    <th>예약일</th>
                                    <th>교시 (시작)</th>
                                    <th>목적</th>
                                    <th>상태</th>
                                </tr>
                            </thead>
                            <tbody id="myReservationBody">
                                <tr><td colspan="6" class="dash-empty">데이터를 불러오는 중...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 예약 요청 목록 (MIDDLEADMIN, ADMIN) -->
                <% if (isMiddleAdmin) { %>
                <div class="dash-card">
                    <div class="dash-card-header">
                        <span class="dash-card-title">예약 요청 목록</span>
                        <span class="dash-card-sub">대기 중 · 예약 시작일 오름차순 · 최대 7건</span>
                    </div>
                    <div class="dash-card-body">
                        <table class="dash-table">
                            <thead>
                                <tr>
                                    <th>신청자</th>
                                    <th>구분</th>
                                    <th>시설·비품명</th>
                                    <th>예약일</th>
                                    <th>교시 (시작)</th>
                                    <th>신청일</th>
                                </tr>
                            </thead>
                            <tbody id="pendingRequestBody">
                                <tr><td colspan="6" class="dash-empty">데이터를 불러오는 중...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <% } %>

            </div>

            <!-- ── 오른쪽: 시계 + 교시 + 알림 ── -->
            <div class="dash-right">

                <!-- 시계 -->
                <div class="clock-card">
                    <div class="clock-day"  id="clockDay"></div>
                    <div class="clock-date" id="clockDate"></div>
                    <div class="clock-divider"></div>
                    <div class="clock-time" id="clockTime"></div>
                    <div class="clock-label">현재 시각</div>
                </div>

                <!-- 오늘 교시 현황 -->
                <div class="dash-card">
                    <div class="dash-card-header">
                        <span class="dash-card-title">오늘 교시 현황</span>
                    </div>
                    <div id="periodList" class="period-list"></div>
                </div>

                <!-- 최근 알림 -->
                <div class="dash-card">
                    <div class="dash-card-header">
                        <span class="dash-card-title">최근 알림</span>
                        <a href="#" class="dash-card-link">전체보기</a>
                    </div>
                    <div id="alarmList" class="alarm-list"></div>
                </div>

            </div>

        </div>
