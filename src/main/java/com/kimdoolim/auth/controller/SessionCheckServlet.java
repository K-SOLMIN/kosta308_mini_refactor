package com.kimdoolim.auth.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet("/session-check.do")
public class SessionCheckServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json; charset=UTF-8");

        boolean valid = req.getSession(false) != null
                     && req.getSession(false).getAttribute("loginUser") != null;

        if (valid) {
            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().write("{\"valid\":true}");
        } else {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"valid\":false}");
        }
    }
}
