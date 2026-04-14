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

@WebServlet("/logout.do")
public class LogoutServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        HttpSession session = req.getSession(false);
        if (session != null) {
            User user = (User) session.getAttribute("loginUser");
            if (user != null) {
                SessionManager.remove(user.getUserId());
                com.kimdoolim.common.AutoLoginManager.removeByUserId(user.getUserId());
            }
            session.invalidate();
        }

        // 자동 로그인 쿠키 삭제
        jakarta.servlet.http.Cookie autoCookie = new jakarta.servlet.http.Cookie("autoLoginToken", "");
        autoCookie.setMaxAge(0);
        autoCookie.setPath("/");
        resp.addCookie(autoCookie);

        resp.sendRedirect(req.getContextPath() + "/index.jsp");
    }
}
