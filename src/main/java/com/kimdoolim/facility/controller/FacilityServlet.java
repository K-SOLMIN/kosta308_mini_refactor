package com.kimdoolim.facility.controller;

import com.kimdoolim.dto.Facility;
import com.kimdoolim.dto.Permission;
import com.kimdoolim.dto.User;
import com.kimdoolim.facility.service.FacilityService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.List;

@WebServlet("/facility.do")
public class FacilityServlet extends HttpServlet {

    private final FacilityService facilityService = new FacilityService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        HttpSession session   = req.getSession(false);
        User loginUser        = (session != null) ? (User) session.getAttribute("loginUser") : null;
        boolean isFetch       = "true".equals(req.getHeader("X-Fetch-Request"));

        // ── 미인증 ──
        if (loginUser == null) {
            if (isFetch) {
                sendJson(resp, HttpServletResponse.SC_UNAUTHORIZED, "{\"error\":\"unauthorized\"}");
            } else {
                resp.sendRedirect(req.getContextPath() + "/index.jsp");
            }
            return;
        }

        // ── 일반 사용자 접근 불가 ──
        if (loginUser.getPermission() == Permission.USER) {
            if (isFetch) {
                sendJson(resp, HttpServletResponse.SC_FORBIDDEN, "{\"error\":\"forbidden\"}");
            } else {
                resp.sendRedirect(req.getContextPath() + "/main.do");
            }
            return;
        }

        // ── 직접 URL 접근 → 쉘로 리다이렉트 ──
        if (!isFetch) {
            resp.sendRedirect(req.getContextPath() + "/main.do");
            return;
        }

        // ── 데이터 조회 ──
        // 중간 관리자 이상이면 관리 기능을 사용할 수 있도록 함
        boolean isAdmin = loginUser.getPermission() == Permission.ADMIN 
                       || loginUser.getPermission() == Permission.MIDDLEADMIN;
        List<Facility> facilities = facilityService.getAllFacilities();
        List<User> managers       = facilityService.getAvailableManagers();

        req.setAttribute("isAdmin", isAdmin);
        req.setAttribute("facilities", facilities);
        req.setAttribute("managers", managers);
        req.getRequestDispatcher("/WEB-INF/views/fragments/facilitymanageviewresponse.jsp")
           .forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        req.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);
        User loginUser      = (session != null) ? (User) session.getAttribute("loginUser") : null;

        if (loginUser == null) {
            sendJson(resp, HttpServletResponse.SC_UNAUTHORIZED, "{\"error\":\"unauthorized\"}");
            return;
        }
        
        // 중간 관리자 이상만 POST 요청(등록/수정/삭제) 가능
        if (loginUser.getPermission() == Permission.USER) {
            sendJson(resp, HttpServletResponse.SC_FORBIDDEN, "{\"error\":\"forbidden\"}");
            return;
        }

        String action = req.getParameter("action");
        boolean ok;

        switch (action == null ? "" : action) {
            case "save":
                ok = facilityService.registerFacility(buildFacility(req, false));
                break;
            case "update":
                ok = facilityService.modifyFacility(buildFacility(req, true));
                break;
            case "delete":
                long facilityId = Long.parseLong(req.getParameter("facilityId"));
                ok = facilityService.removeFacility(facilityId);
                break;
            default:
                sendJson(resp, HttpServletResponse.SC_BAD_REQUEST, "{\"error\":\"unknown action\"}");
                return;
        }

        sendJson(resp, HttpServletResponse.SC_OK, ok ? "{\"success\":true}" : "{\"success\":false}");
    }

    // ── 요청 파라미터 → Facility 빌드 ──────────────────────────────
    private Facility buildFacility(HttpServletRequest req, boolean withId) {
        Facility.Builder b = Facility.builder()
            .name(req.getParameter("name"))
            .location(req.getParameter("location"))
            .maxCapacity(Integer.parseInt(req.getParameter("maxCapacity")))
            .maxReservationUnit(req.getParameter("maxReservationUnit"))
            .maxReservationValue(Integer.parseInt(req.getParameter("maxReservationValue")))
            .status(req.getParameter("status"));

        String mgrId = req.getParameter("managerId");
        if (mgrId != null && !mgrId.isBlank()) {
            b.managerId(Integer.parseInt(mgrId));
        }
        if (withId) {
            b.facilityId(Long.parseLong(req.getParameter("facilityId")));
        }
        return b.build();
    }

    private void sendJson(HttpServletResponse resp, int status, String body) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write(body);
    }
}
