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
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
            background-color: #eef2f7;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }

        /* ── 헤더 ── */
        .header {
            height: 56px;
            background-color: #1a3a6b;
            border-bottom: 3px solid #f0a500;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            flex-shrink: 0;
            z-index: 100;
        }

        .header .logo-area {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .header .logo-badge {
            background-color: #f0a500;
            color: #1a3a6b;
            font-size: 15px;
            font-weight: 900;
            letter-spacing: 1px;
            padding: 4px 12px;
            border-radius: 4px;
        }

        .header .system-name {
            color: #fff;
            font-size: 15px;
            font-weight: 600;
            letter-spacing: -0.3px;
        }

        .header .header-right {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .header .user-info {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #d0dced;
            font-size: 13px;
        }

        .header .user-name  { color: #fff; font-weight: 600; }

        .perm-badge {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 2px;
            font-weight: 600;
        }
        .perm-badge.admin       { background-color: #c0392b; color: #fff; }
        .perm-badge.middleadmin { background-color: #f0a500; color: #1a3a6b; }
        .perm-badge.user        { background-color: #2d6aa0; color: #fff; }

        .btn-logout {
            background: none;
            border: 1px solid #4a6a9a;
            color: #b0c4de;
            font-size: 12px;
            font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
            padding: 5px 14px;
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.15s;
        }
        .btn-logout:hover {
            background-color: #f0a500;
            border-color: #f0a500;
            color: #1a3a6b;
            font-weight: 700;
        }

        /* ── 레이아웃 ── */
        .body-layout {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        /* ── 사이드바 ── */
        .sidebar {
            width: 216px;
            background-color: #1e2d45;
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            overflow-y: auto;
        }
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-thumb { background-color: #3a5070; border-radius: 2px; }

        .profile-box {
            padding: 20px 18px 16px;
            border-bottom: 1px solid #2c3f5a;
        }
        .profile-name {
            color: #fff;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 6px;
        }
        .profile-meta {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .profile-status {
            font-size: 11px;
            color: #6a86aa;
        }

        .inactive-notice {
            margin: 12px 12px 0;
            background-color: rgba(192, 57, 43, 0.18);
            border-left: 3px solid #c0392b;
            border-radius: 2px;
            padding: 8px 10px;
            font-size: 11px;
            color: #e8a0a0;
            line-height: 1.6;
        }

        .menu-section { padding: 14px 0 2px; }

        .menu-section-label {
            font-size: 10px;
            font-weight: 700;
            color: #4a6a8a;
            letter-spacing: 0.8px;
            padding: 0 18px 6px;
            text-transform: uppercase;
        }

        .menu-item {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 9px 18px;
            font-size: 13px;
            color: #8aaac8;
            text-decoration: none;
            border-left: 3px solid transparent;
            transition: background-color 0.12s, color 0.12s;
        }
        .menu-item:hover {
            background-color: #263d58;
            color: #e0ecf8;
            border-left-color: #f0a500;
        }
        .menu-item.active {
            background-color: #263d58;
            color: #fff;
            border-left-color: #f0a500;
            font-weight: 600;
        }
        .menu-item.disabled {
            color: #3a5070;
            pointer-events: none;
            cursor: default;
        }
        .menu-icon {
            font-size: 13px;
            width: 16px;
            text-align: center;
            flex-shrink: 0;
        }

        .menu-divider {
            height: 1px;
            background-color: #2c3f5a;
            margin: 6px 0;
        }

        /* ── 콘텐츠 ── */
        .content {
            flex: 1;
            overflow-y: auto;
            padding: 28px 32px;
        }
        .content::-webkit-scrollbar { width: 6px; }
        .content::-webkit-scrollbar-thumb { background-color: #c0ccd8; border-radius: 3px; }

        .page-title {
            font-size: 18px;
            font-weight: 700;
            color: #1a3a6b;
            margin-bottom: 4px;
            letter-spacing: -0.4px;
        }
        .page-subtitle {
            font-size: 13px;
            color: #8a9bab;
            margin-bottom: 24px;
        }

        .inactive-banner {
            background-color: #fdf0ee;
            border: 1px solid #e8b4ad;
            border-left: 4px solid #c0392b;
            border-radius: 3px;
            padding: 14px 18px;
            margin-bottom: 24px;
            font-size: 13px;
            color: #7a2a20;
            line-height: 1.7;
        }

        .section-title {
            font-size: 12px;
            font-weight: 700;
            color: #6a86aa;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #dce4ed;
        }

        .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
            gap: 14px;
            margin-bottom: 28px;
        }

        .menu-card {
            background-color: #fff;
            border: 1px solid #dce4ed;
            border-radius: 4px;
            padding: 18px 16px;
            text-decoration: none;
            display: flex;
            flex-direction: column;
            gap: 10px;
            transition: box-shadow 0.15s, border-color 0.15s, transform 0.1s;
        }
        .menu-card:hover {
            box-shadow: 0 4px 14px rgba(26, 58, 107, 0.11);
            border-color: #1a3a6b;
            transform: translateY(-1px);
        }

        .card-icon {
            width: 38px;
            height: 38px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        .card-icon.blue   { background-color: #e8f0fb; }
        .card-icon.gold   { background-color: #fef5e0; }
        .card-icon.green  { background-color: #e8f5ec; }
        .card-icon.red    { background-color: #fbeaea; }
        .card-icon.purple { background-color: #f0eafb; }
        .card-icon.teal   { background-color: #e6f6f6; }

        .card-title {
            font-size: 14px;
            font-weight: 700;
            color: #1e2d45;
        }
        .card-desc {
            font-size: 12px;
            color: #8a9bab;
            line-height: 1.5;
        }
    </style>
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
            <a href="<%= ctx %>/main.do" class="menu-item active">
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
            <a href="#" class="menu-item">
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

        <div class="page-title">대시보드</div>
        <div class="page-subtitle"><%= loginUser.getName() %>님, 안녕하세요.</div>

        <% if (!isActive) { %>
        <div class="inactive-banner">
            <strong>⚠ 계정이 비활성 상태입니다 (<%= statusLabel %>)</strong><br>
            예약하기, 알림 등 일부 기능 이용이 제한됩니다. 이용 문의는 시스템 관리자에게 연락하세요.
        </div>
        <% } %>

        <!-- 기본 메뉴 카드 -->
        <div class="section-title">기본 메뉴</div>
        <div class="card-grid">

            <% if (isActive) { %>
            <a href="#" class="menu-card">
                <div class="card-icon blue">📅</div>
                <div class="card-title">예약하기</div>
                <div class="card-desc">시설 및 비품을 예약합니다.</div>
            </a>
            <% } %>

            <a href="#" class="menu-card">
                <div class="card-icon gold">📋</div>
                <div class="card-title">나의 예약 내역</div>
                <div class="card-desc">예약 현황과 상태를 확인합니다.</div>
            </a>

            <% if (isActive) { %>
            <a href="#" class="menu-card">
                <div class="card-icon teal">🔔</div>
                <div class="card-title">알림함</div>
                <div class="card-desc">새 알림을 확인합니다.</div>
            </a>
            <% } %>

            <a href="#" class="menu-card">
                <div class="card-icon purple">👤</div>
                <div class="card-title">마이페이지</div>
                <div class="card-desc">내 정보와 비밀번호를 관리합니다.</div>
            </a>

        </div>

        <!-- 관리자 메뉴 카드 -->
        <% if (isMiddleAdmin) { %>
        <div class="section-title">관리 메뉴</div>
        <div class="card-grid">

            <a href="#" class="menu-card">
                <div class="card-icon blue">📝</div>
                <div class="card-title">예약 관리</div>
                <div class="card-desc">예약 승인 및 거절을 처리합니다.</div>
            </a>

            <a href="#" class="menu-card">
                <div class="card-icon green">🏫</div>
                <div class="card-title">시설 관리</div>
                <div class="card-desc">시설 정보를 등록하고 관리합니다.</div>
            </a>

            <a href="#" class="menu-card">
                <div class="card-icon gold">🖥</div>
                <div class="card-title">비품 관리</div>
                <div class="card-desc">비품 세트 및 낱개를 관리합니다.</div>
            </a>

            <a href="#" class="menu-card">
                <div class="card-icon red">🚫</div>
                <div class="card-title">제한 일정 관리</div>
                <div class="card-desc">교시별 예약 차단 일정을 설정합니다.</div>
            </a>

        </div>
        <% } %>

        <!-- 최고 관리자 메뉴 카드 -->
        <% if (isAdmin) { %>
        <div class="section-title">시스템 관리</div>
        <div class="card-grid">

            <a href="#" class="menu-card">
                <div class="card-icon purple">👥</div>
                <div class="card-title">사용자 관리</div>
                <div class="card-desc">사용자 등록, 권한, 상태를 관리합니다.</div>
            </a>

            <a href="#" class="menu-card">
                <div class="card-icon red">📵</div>
                <div class="card-title">기간 차단 관리</div>
                <div class="card-desc">방학 등 장기 차단 기간을 설정합니다.</div>
            </a>

        </div>
        <% } %>

    </main>
</div>

</body>
</html>
