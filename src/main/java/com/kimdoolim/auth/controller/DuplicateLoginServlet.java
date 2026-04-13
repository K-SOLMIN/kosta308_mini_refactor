package com.kimdoolim.auth.controller;

import com.kimdoolim.common.SessionManager;
import com.kimdoolim.dto.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/login-duplicate.do")
public class DuplicateLoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);
        if (session == null) {
            resp.sendRedirect(req.getContextPath() + "/index.jsp");
            return;
        }

        User pendingUser = (User) session.getAttribute("pendingUser");
        if (pendingUser == null) {
            resp.sendRedirect(req.getContextPath() + "/index.jsp");
            return;
        }

        String action = req.getParameter("action");

        if ("confirm".equals(action)) {
            // 기존 세션 강제 로그아웃 후 현재 세션으로 로그인
            SessionManager.invalidateExisting(pendingUser.getUserId());

            session.removeAttribute("pendingUser");
            session.setAttribute("loginUser", pendingUser);
            SessionManager.register(pendingUser.getUserId(), session);

            resp.sendRedirect(req.getContextPath() + "/main.do");
        } else {
            // 취소 — 현재 세션의 pendingUser 제거 후 로그인 페이지로
            session.removeAttribute("pendingUser");
            resp.sendRedirect(req.getContextPath() + "/index.jsp");
        }
    }
}
