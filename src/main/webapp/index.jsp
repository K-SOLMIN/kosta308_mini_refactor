<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="jakarta.servlet.http.Cookie" %>
<%@ page import="com.kimdoolim.dto.User" %>
<%@ page import="com.kimdoolim.common.AutoLoginManager" %>
<%@ page import="com.kimdoolim.common.SessionManager" %>
<%
    // 이미 로그인된 세션이 있는 경우 메인으로 이동
    if (session.getAttribute("loginUser") != null) {
        response.sendRedirect(request.getContextPath() + "/main.do");
        return;
    }

    String savedId = "";
    boolean remembered = false;
    String autoLoginToken = null;

    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
        for (Cookie c : cookies) {
            if ("savedId".equals(c.getName()) && !c.getValue().isEmpty()) {
                savedId = c.getValue();
                remembered = true;
            } else if ("autoLoginToken".equals(c.getName()) && !c.getValue().isEmpty()) {
                autoLoginToken = c.getValue();
            }
        }
    }

    // 자동 로그인 처리
    if (autoLoginToken != null) {
        User autoUser = AutoLoginManager.getUser(autoLoginToken);
        if (autoUser != null && autoUser.isActive()) {
            // 중복 로그인 체크 (기존 세션 있으면 만료시키거나 새로 등록)
            if (SessionManager.hasActiveSession(autoUser.getUserId())) {
                SessionManager.invalidateExisting(autoUser.getUserId());
            }

            session.setAttribute("loginUser", autoUser);
            SessionManager.register(autoUser.getUserId(), session);
            response.sendRedirect(request.getContextPath() + "/main.do");
            return;
        } else {
            // 유효하지 않은 토큰이면 쿠키 삭제
            Cookie invalidAutoCookie = new Cookie("autoLoginToken", "");
            invalidAutoCookie.setMaxAge(0);
            invalidAutoCookie.setPath("/");
            response.addCookie(invalidAutoCookie);
        }
    }

    String errorMsg = (String) request.getAttribute("errorMsg");
    if (errorMsg == null && "kicked".equals(request.getParameter("reason"))) {
        errorMsg = "다른 기기에서 로그인하여 현재 세션이 종료되었습니다.";
    }
%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SBLIM - 학교 시설 예약 관리 시스템</title>
    <link rel="stylesheet" href="<%= request.getContextPath() %>/static/css/index.css?v=<%=System.currentTimeMillis()%>">
</head>
<body>

    <!-- 상단 헤더 -->
    <header class="site-header">
        <div class="logo-area">
            <div class="logo-icon">SBLIM</div>
        </div>
        <div class="header-right">School Facility Reservation Management System</div>
    </header>

    <!-- 메인 영역 -->
    <main class="main-wrapper">
        <div class="login-container">

            <!-- 왼쪽 안내 패널 -->
            <div class="info-panel">
                <div class="panel-top">
                    <div class="logo-big">SBLIM</div>

                    <div class="notice-box">
                        <div class="notice-title">이용 안내</div>
                        <ul>
                            <li>인가된 사용자만 이용 가능합니다.</li>
                            <li>분실 시 관리자에게 문의하세요.</li>
                            <li>5회 오류 시 계정이 잠길 수 있습니다.</li>
                        </ul>
                    </div>
                </div>
                <div class="panel-bottom">
                    ※ 운영 문의 : 시스템 관리자
                </div>
            </div>

            <!-- 오른쪽 로그인 패널 -->
            <div class="login-panel">
                <h3>로그인</h3>
                <p class="login-desc">아이디와 비밀번호를 입력하여 로그인하세요.</p>

                <% if (errorMsg != null) { %>
                <div class="error-msg">⚠ <%= errorMsg %></div>
                <% } %>

                <form action="<%= request.getContextPath()%>/login.do" method="post">
                    <div class="form-group">
                        <label for="userId">아이디 <span class="required">*</span></label>
                        <input type="text" id="userId" name="userId" placeholder="아이디를 입력하세요" autocomplete="username" maxlength="30" value="<%= savedId %>">
                    </div>
                    <div class="form-group">
                        <label for="userPw">비밀번호 <span class="required">*</span></label>
                        <input type="password" id="userPw" name="userPw" placeholder="비밀번호를 입력하세요" autocomplete="current-password" maxlength="30">
                    </div>

                    <div class="login-options">
                        <label class="checkbox-label">
                            <input type="checkbox" name="rememberMe" <%= remembered ? "checked" : "" %>> 아이디 저장
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="autoLogin"> 자동 로그인
                        </label>
                    </div>

                    <button type="submit" class="btn-login">로그인</button>
                </form>

                <div class="login-footer-links">
                    <a href="#">아이디 찾기</a>
                    <a href="#">비밀번호 찾기</a>
                    <a href="#">관리자 문의</a>
                </div>
            </div>

        </div>
    </main>

    <!-- 하단 푸터 -->
    <footer class="site-footer">
        <span>SBLIM · 학교 시설 예약 관리 시스템</span>·
        <span>Copyright &copy; 2026. All Rights Reserved.</span>
    </footer>

    <script src="<%= request.getContextPath() %>/static/js/index.js"></script>
</body>
</html>
