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
            }
            session.invalidate();
        }
        resp.sendRedirect(req.getContextPath() + "/index.jsp");
    }
}
