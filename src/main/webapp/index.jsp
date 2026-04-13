<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="jakarta.servlet.http.Cookie" %>
<%
    String savedId = "";
    boolean remembered = false;
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
        for (Cookie c : cookies) {
            if ("savedId".equals(c.getName()) && !c.getValue().isEmpty()) {
                savedId = c.getValue();
                remembered = true;
                break;
            }
        }
    }

    String errorMsg = (String) request.getAttribute("errorMsg");
%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SBLIM - 학교 시설 예약 관리 시스템</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: '맑은 고딕', 'Malgun Gothic', '나눔고딕', sans-serif;
            background-color: #eef2f7;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* 상단 헤더 */
        .site-header {
            background-color: #1a3a6b;
            color: #fff;
            padding: 0 40px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid #f0a500;
        }

        .site-header .logo-area {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .site-header .logo-icon {
            padding: 0 14px;
            height: 36px;
            background-color: #f0a500;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 900;
            color: #1a3a6b;
            letter-spacing: 1.5px;
        }

        /* 메인 컨테이너 */
        .main-wrapper {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
        }

        .login-container {
            display: flex;
            width: 860px;
            background-color: #fff;
            border: 1px solid #cdd5e0;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.10);
        }

        /* 왼쪽 안내 패널 */
        .info-panel {
            width: 340px;
            background-color: #1a3a6b;
            color: #fff;
            padding: 50px 36px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .info-panel .panel-top .logo-big {
            font-size: 52px;
            font-weight: 900;
            color: #f0a500;
            letter-spacing: 4px;
            margin-bottom: 32px;
            line-height: 1;
        }

        .info-panel .notice-box {
            background-color: rgba(255, 255, 255, 0.07);
            border-left: 3px solid #f0a500;
            border-radius: 2px;
            padding: 14px 16px;
        }

        .info-panel .notice-box .notice-title {
            font-size: 12px;
            font-weight: 700;
            color: #f0a500;
            margin-bottom: 8px;
            letter-spacing: 0.3px;
        }

        .info-panel .notice-box ul {
            list-style: none;
            padding: 0;
        }

        .info-panel .notice-box ul li {
            font-size: 12px;
            color: #b0c4de;
            padding: 2px 0;
            padding-left: 12px;
            position: relative;
            white-space: nowrap;
        }

        .info-panel .notice-box ul li::before {
            content: '·';
            position: absolute;
            left: 0;
            color: #f0a500;
        }

        .info-panel .panel-bottom {
            font-size: 11px;
            color: #6a86aa;
        }

        /* 오른쪽 로그인 패널 */
        .login-panel {
            flex: 1;
            padding: 50px 48px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .login-panel h3 {
            font-size: 20px;
            font-weight: 700;
            color: #1a3a6b;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
        }

        .login-panel .login-desc {
            font-size: 13px;
            color: #7a8ca0;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e8ecf0;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-group label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #3a4a5c;
            margin-bottom: 6px;
        }

        .form-group .required {
            color: #c0392b;
            margin-left: 2px;
        }

        .form-group input[type="text"],
        .form-group input[type="password"] {
            width: 100%;
            height: 42px;
            padding: 0 14px;
            border: 1px solid #c5cdd8;
            border-radius: 3px;
            font-size: 14px;
            font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
            color: #2c3e50;
            background-color: #fafbfc;
            transition: border-color 0.15s, box-shadow 0.15s;
            outline: none;
        }

        .form-group input[type="text"]:focus,
        .form-group input[type="password"]:focus {
            border-color: #1a3a6b;
            background-color: #fff;
            box-shadow: 0 0 0 3px rgba(26, 58, 107, 0.10);
        }

        .form-group input::placeholder {
            color: #b0bec5;
            font-size: 13px;
        }

        /* 옵션 영역 */
        .login-options {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            margin-top: 4px;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 7px;
            font-size: 13px;
            color: #5a6a7a;
            cursor: pointer;
            user-select: none;
        }

        .checkbox-label input[type="checkbox"] {
            width: 15px;
            height: 15px;
            accent-color: #1a3a6b;
            cursor: pointer;
        }

        /* 에러 메시지 */
        .error-msg {
            background-color: #fdf0ee;
            border: 1px solid #e8b4ad;
            border-left: 3px solid #c0392b;
            border-radius: 3px;
            padding: 10px 14px;
            font-size: 13px;
            color: #7a2a20;
            margin-bottom: 16px;
        }

        /* 로그인 버튼 */
        .btn-login {
            width: 100%;
            height: 46px;
            background-color: #1a3a6b;
            color: #fff;
            border: none;
            border-radius: 3px;
            font-size: 15px;
            font-weight: 700;
            font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: background-color 0.15s;
        }

        .btn-login:hover {
            background-color: #15306090;
        }

        .btn-login:active {
            background-color: #0f2448;
        }

        /* 하단 링크 */
        .login-footer-links {
            display: flex;
            justify-content: center;
            gap: 0;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e8ecf0;
        }

        .login-footer-links a {
            font-size: 12px;
            color: #7a8ca0;
            text-decoration: none;
            padding: 0 14px;
            border-right: 1px solid #d0d8e0;
            transition: color 0.15s;
        }

        .login-footer-links a:last-child {
            border-right: none;
        }

        .login-footer-links a:hover {
            color: #1a3a6b;
            text-decoration: underline;
        }

        /* 하단 푸터 */
        .site-footer {
            background-color: #2c3e50;
            color: #8a9bab;
            text-align: center;
            font-size: 12px;
            padding: 14px 20px;
            line-height: 1.6;
        }

        .site-footer span {
            margin: 0 6px;
        }
    </style>
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

</body>
</html>
