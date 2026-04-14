package com.kimdoolim.main.controller;

import com.kimdoolim.dto.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet("/main.do")
public class MainServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        User loginUser = (User) req.getSession().getAttribute("loginUser");
        if (loginUser == null) {
            boolean isFetch = "true".equals(req.getHeader("X-Fetch-Request"));
            if (isFetch) {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                resp.setContentType("application/json; charset=UTF-8");
                resp.getWriter().write("{\"error\":\"unauthorized\"}");
            } else {
                resp.sendRedirect(req.getContextPath() + "/index.jsp");
            }
            return;
        }
        boolean isFetch = "true".equals(req.getHeader("X-Fetch-Request"));
        if (isFetch) {
            req.getRequestDispatcher("/WEB-INF/views/fragments/dashboard.jsp").forward(req, resp);
        } else {
            req.getRequestDispatcher("/WEB-INF/views/main.jsp").forward(req, resp);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        doGet(req, resp);
    }
}
