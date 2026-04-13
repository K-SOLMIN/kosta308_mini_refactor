<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="com.kimdoolim.dto.User" %>
<%
    User pendingUser = (User) session.getAttribute("pendingUser");
    if (pendingUser == null) {
        response.sendRedirect(request.getContextPath() + "/index.jsp");
        return;
    }
%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SBLIM - 중복 로그인 감지</title>
    <link rel="stylesheet" href="<%= request.getContextPath() %>/static/css/index.css">
    <style>
        .confirm-wrapper {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
        }

        .confirm-card {
            background-color: #fff;
            border: 1px solid #cdd5e0;
            border-radius: 4px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.10);
            width: 440px;
            overflow: hidden;
        }

        .confirm-card .card-header {
            background-color: #1a3a6b;
            padding: 18px 24px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 3px solid #f0a500;
        }

        .confirm-card .card-header .warn-icon {
            background-color: #f0a500;
            color: #1a3a6b;
            font-size: 14px;
            font-weight: 900;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .confirm-card .card-header h2 {
            color: #fff;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: -0.3px;
        }

        .confirm-card .card-body {
            padding: 28px 28px 24px;
        }

        .confirm-card .alert-box {
            background-color: #fef8ec;
            border: 1px solid #f5d97a;
            border-left: 4px solid #f0a500;
            border-radius: 3px;
            padding: 14px 16px;
            margin-bottom: 20px;
            font-size: 13px;
            color: #6a4a00;
            line-height: 1.7;
        }

        .confirm-card .alert-box strong {
            display: block;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 6px;
            color: #4a3200;
        }

        .confirm-card .user-info-row {
            display: flex;
            align-items: center;
            gap: 10px;
            background-color: #f4f6f9;
            border: 1px solid #dce4ed;
            border-radius: 3px;
            padding: 12px 16px;
            margin-bottom: 24px;
            font-size: 13px;
            color: #3a4a5c;
        }

        .confirm-card .user-info-row .user-label {
            font-weight: 700;
            color: #1a3a6b;
        }

        .confirm-card .btn-row {
            display: flex;
            gap: 10px;
        }

        .btn-confirm {
            flex: 1;
            height: 42px;
            background-color: #c0392b;
            color: #fff;
            border: none;
            border-radius: 3px;
            font-size: 14px;
            font-weight: 700;
            font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
            cursor: pointer;
            transition: background-color 0.15s;
        }
        .btn-confirm:hover { background-color: #a93226; }

        .btn-cancel {
            flex: 1;
            height: 42px;
            background-color: #fff;
            color: #3a4a5c;
            border: 1px solid #c5cdd8;
            border-radius: 3px;
            font-size: 14px;
            font-weight: 600;
            font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
            cursor: pointer;
            transition: background-color 0.15s, border-color 0.15s;
        }
        .btn-cancel:hover {
            background-color: #f4f6f9;
            border-color: #1a3a6b;
            color: #1a3a6b;
        }

        .confirm-card .card-footer {
            padding: 12px 28px;
            background-color: #f8f9fb;
            border-top: 1px solid #e8ecf0;
            font-size: 11px;
            color: #9aabb8;
        }
    </style>
</head>
<body>

    <header class="site-header">
        <div class="logo-area">
            <div class="logo-icon">SBLIM</div>
        </div>
        <div class="header-right">School Facility Reservation Management System</div>
    </header>

    <main class="confirm-wrapper">
        <div class="confirm-card">

            <div class="card-header">
                <div class="warn-icon">!</div>
                <h2>중복 로그인 감지</h2>
            </div>

            <div class="card-body">
                <div class="alert-box">
                    <strong>이미 다른 곳에서 로그인되어 있습니다.</strong>
                    기존 세션을 로그아웃하고 현재 기기에서 로그인하시겠습니까?<br>
                    확인을 누르면 기존 접속이 즉시 종료됩니다.
                </div>

                <div class="user-info-row">
                    <span class="user-label">계정</span>
                    <span><%= pendingUser.getName() %> (<%= pendingUser.getId() %>)</span>
                </div>

                <div class="btn-row">
                    <form action="<%= request.getContextPath() %>/login-duplicate.do" method="post" style="flex:1; display:flex;">
                        <input type="hidden" name="action" value="confirm">
                        <button type="submit" class="btn-confirm">확인 (기존 세션 로그아웃)</button>
                    </form>
                    <form action="<%= request.getContextPath() %>/login-duplicate.do" method="post" style="flex:1; display:flex;">
                        <input type="hidden" name="action" value="cancel">
                        <button type="submit" class="btn-cancel">취소</button>
                    </form>
                </div>
            </div>

            <div class="card-footer">
                ※ 본인이 아닌 경우 즉시 비밀번호를 변경하고 관리자에게 문의하세요.
            </div>

        </div>
    </main>

    <footer class="site-footer">
        <span>SBLIM · 학교 시설 예약 관리 시스템</span>·
        <span>Copyright &copy; 2026. All Rights Reserved.</span>
    </footer>

</body>
</html>
