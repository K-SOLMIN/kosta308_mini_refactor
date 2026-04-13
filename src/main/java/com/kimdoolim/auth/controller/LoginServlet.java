package com.kimdoolim.auth.controller;

import com.kimdoolim.auth.service.LoginService;
import com.kimdoolim.dto.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/login.do")
public class LoginServlet extends HttpServlet {

    private static final String COOKIE_NAME = "savedId";
    private static final int    COOKIE_AGE  = 60 * 60 * 24 * 30; // 30일

    private final LoginService loginService = new LoginService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");

        String id         = req.getParameter("userId");
        String password   = req.getParameter("userPw");
        boolean rememberMe = "on".equals(req.getParameter("rememberMe"));

        User user = loginService.login(id, password);

        if (user == null) {
            req.setAttribute("errorMsg", "아이디 또는 비밀번호가 올바르지 않습니다.");
            req.getRequestDispatcher("/index.jsp").forward(req, resp);
            return;
        }

        if (!user.isActive()) {
            req.setAttribute("errorMsg", "비활성화된 계정입니다. 관리자에게 문의하세요.");
            req.getRequestDispatcher("/index.jsp").forward(req, resp);
            return;
        }

        // 아이디 저장 쿠키 처리
        Cookie cookie = new Cookie(COOKIE_NAME, rememberMe ? id : "");
        cookie.setMaxAge(rememberMe ? COOKIE_AGE : 0);
        cookie.setPath("/");
        resp.addCookie(cookie);

        HttpSession session = req.getSession();
        session.setAttribute("loginUser", user);

        resp.sendRedirect(req.getContextPath() + "/main.do");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.sendRedirect(req.getContextPath() + "/index.jsp");
    }
}
