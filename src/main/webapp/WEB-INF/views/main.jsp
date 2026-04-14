<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.kimdoolim.dto.User" %>
<%@ page import="com.kimdoolim.dto.Permission" %>
<%@ page import="com.kimdoolim.dto.UserStatus" %>
<%
    User loginUser = (User) session.getAttribute("loginUser");
    if (loginUser == null) {
        response.sendRedirect(request.getContextPath() + "/index.jsp");
        return;
    }

    boolean isActive      = loginUser.isActive();
    boolean isMiddleAdmin = loginUser.getPermission() == Permission.MIDDLEADMIN
                         || loginUser.getPermission() == Permission.ADMIN;
    boolean isAdmin       = loginUser.getPermission() == Permission.ADMIN;

    String permLabel;
    switch (loginUser.getPermission()) {
        case ADMIN:       permLabel = "최고 관리자"; break;
        case MIDDLEADMIN: permLabel = "중간 관리자"; break;
        default:          permLabel = "일반 사용자"; break;
    }

    String statusLabel = loginUser.getUserStatus().name();
    String ctx = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SBLIM - 대시보드</title>
    <meta name="ctx" content="<%= request.getContextPath() %>">
    <meta name="isMiddleAdmin" content="<%= isMiddleAdmin %>">
    <link rel="stylesheet" href="<%= request.getContextPath() %>/static/css/main.css?v=<%=System.currentTimeMillis()%>">
</head>
<body>

<!-- ── 헤더 ── -->
<header class="header">
    <div class="logo-area">
        <span class="logo-badge">SBLIM</span>
        <span class="system-name">학교 시설 예약 관리 시스템</span>
    </div>
    <div class="header-right">
        <div class="user-info">
            <span class="user-name"><%= loginUser.getName() %></span>
            <span>|</span>
            <% if (isAdmin) { %>
                <span class="perm-badge admin"><%= permLabel %></span>
            <% } else if (isMiddleAdmin) { %>
                <span class="perm-badge middleadmin"><%= permLabel %></span>
            <% } else { %>
                <span class="perm-badge user"><%= permLabel %></span>
            <% } %>
            <% if (!isActive) { %>
                <span style="font-size:11px; color:#e87070;">(비활성)</span>
            <% } %>
        </div>
        <form action="<%= ctx %>/logout.do" method="get" style="margin:0;">
            <button type="submit" class="btn-logout">로그아웃</button>
        </form>
    </div>
</header>

<!-- ── 바디 ── -->
<div class="body-layout">

    <!-- ── 사이드바 ── -->
    <nav class="sidebar">

        <div class="profile-box">
            <div class="profile-name"><%= loginUser.getName() %></div>
            <div class="profile-meta">
                <% if (isAdmin) { %>
                    <span class="perm-badge admin"><%= permLabel %></span>
                <% } else if (isMiddleAdmin) { %>
                    <span class="perm-badge middleadmin"><%= permLabel %></span>
                <% } else { %>
                    <span class="perm-badge user"><%= permLabel %></span>
                <% } %>
                <span class="profile-status"><%= statusLabel %></span>
            </div>
        </div>

        <% if (!isActive) { %>
        <div class="inactive-notice">
            비활성 계정 — 일부 메뉴가 제한됩니다.
        </div>
        <% } %>

        <!-- 예약 -->
        <div class="menu-section">
            <div class="menu-section-label">예약</div>
            <a href="<%= ctx %>/main.do" class="menu-item active" data-spa="true">
                <span class="menu-icon">■</span> 대시보드
            </a>
            <% if (isActive) { %>
            <a href="#" class="menu-item">
                <span class="menu-icon">+</span> 예약하기
            </a>
            <% } else { %>
            <span class="menu-item disabled">
                <span class="menu-icon">+</span> 예약하기
            </span>
            <% } %>
            <a href="#" class="menu-item">
                <span class="menu-icon">≡</span> 나의 예약 내역
            </a>
        </div>

        <div class="menu-divider"></div>

        <!-- 알림 -->
        <div class="menu-section">
            <div class="menu-section-label">알림</div>
            <% if (isActive) { %>
            <a href="#" class="menu-item">
                <span class="menu-icon">○</span> 알림함
            </a>
            <% } else { %>
            <span class="menu-item disabled">
                <span class="menu-icon">○</span> 알림함
            </span>
            <% } %>
        </div>

        <!-- 시설·비품 관리 (MIDDLEADMIN+) -->
        <% if (isMiddleAdmin) { %>
        <div class="menu-divider"></div>
        <div class="menu-section">
            <div class="menu-section-label">시설·비품 관리</div>
            <a href="#" class="menu-item">
                <span class="menu-icon">◆</span> 예약 관리
            </a>
            <a href="<%= ctx %>/facility.do" class="menu-item" data-spa="true">
                <span class="menu-icon">◆</span> 시설 관리
            </a>
            <a href="#" class="menu-item">
                <span class="menu-icon">◆</span> 비품 관리
            </a>
            <a href="#" class="menu-item">
                <span class="menu-icon">◆</span> 제한 일정 관리
            </a>
        </div>
        <% } %>

        <!-- 사용자 관리 (ADMIN only) -->
        <% if (isAdmin) { %>
        <div class="menu-divider"></div>
        <div class="menu-section">
            <div class="menu-section-label">사용자 관리</div>
            <a href="#" class="menu-item">
                <span class="menu-icon">◆</span> 사용자 목록
            </a>
            <a href="#" class="menu-item">
                <span class="menu-icon">◆</span> 기간 차단 관리
            </a>
        </div>
        <% } %>

        <div class="menu-divider"></div>

        <!-- 내 정보 -->
        <div class="menu-section">
            <div class="menu-section-label">내 정보</div>
            <a href="#" class="menu-item">
                <span class="menu-icon">◉</span> 마이페이지
            </a>
        </div>

    </nav>

    <!-- ── 콘텐츠 ── -->
    <main class="content">
        <jsp:include page="/WEB-INF/views/fragments/dashboard.jsp" />
    </main>
</div>

    <script src="<%= request.getContextPath() %>/static/js/main.js"></script>
</body>
</html>
