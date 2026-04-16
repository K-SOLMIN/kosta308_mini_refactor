package com.kimdoolim.equipment.controller;

import com.kimdoolim.dto.Equipment;
import com.kimdoolim.dto.Permission;
import com.kimdoolim.dto.User;
import com.kimdoolim.equipment.service.EquipmentService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.List;

@WebServlet("/equipment.do")
public class EquipmentServlet extends HttpServlet {

    private final EquipmentService equipmentService = EquipmentService.getInstance();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        HttpSession session = req.getSession(false);
        User loginUser      = (session != null) ? (User) session.getAttribute("loginUser") : null;
        boolean isFetch     = "true".equals(req.getHeader("X-Fetch-Request"));

        // ── 미인증 ──
        if (loginUser == null) {
            if (isFetch) sendJson(resp, HttpServletResponse.SC_UNAUTHORIZED, "{\"error\":\"unauthorized\"}");
            else         resp.sendRedirect(req.getContextPath() + "/index.jsp");
            return;
        }

        // ── 일반 사용자 접근 불가 ──
        if (loginUser.getPermission() == Permission.USER) {
            if (isFetch) sendJson(resp, HttpServletResponse.SC_FORBIDDEN, "{\"error\":\"forbidden\"}");
            else         resp.sendRedirect(req.getContextPath() + "/main.do");
            return;
        }

        // ── 직접 URL 접근 → 메인으로 리다이렉트 ──
        if (!isFetch) {
            resp.sendRedirect(req.getContextPath() + "/main.do");
            return;
        }

        // ── 데이터 조회 ──
        List<Equipment> equipments = equipmentService.getAllEquipments();
        List<User>      managers   = equipmentService.getAvailableManagers();

        Permission perm = loginUser.getPermission();

        // 중간관리자는 본인이 담당자인 비품만 조회
        if (perm == Permission.MIDDLEADMIN) {
            final Integer userId = loginUser.getUserId();
            equipments = equipments.stream()
                .filter(e -> e.getManagerId() != null && e.getManagerId().equals(userId))
                .toList();

            if (equipments.isEmpty()) {
                sendJson(resp, HttpServletResponse.SC_FORBIDDEN, "{\"error\":\"no_managed_equipment\"}");
                return;
            }
        }

        req.setAttribute("isAdmin",         perm == Permission.ADMIN);
        req.setAttribute("userPermission",  perm.name().trim());
        req.setAttribute("equipments",      equipments);
        req.setAttribute("managers",        managers);
        req.getRequestDispatcher("/WEB-INF/views/fragments/equipmentmanageviewresponse.jsp")
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
        if (loginUser.getPermission() == Permission.USER) {
            sendJson(resp, HttpServletResponse.SC_FORBIDDEN, "{\"error\":\"forbidden\"}");
            return;
        }

        String action = req.getParameter("action");
        boolean ok;

        switch (action == null ? "" : action) {
            case "save":
                ok = equipmentService.registerEquipment(buildEquipment(req, false));
                break;
            case "update":
                ok = equipmentService.modifyEquipment(buildEquipment(req, true));
                break;
            case "delete":
                long equipmentId = Long.parseLong(req.getParameter("equipmentId"));
                ok = equipmentService.removeEquipment(equipmentId);
                break;
            default:
                sendJson(resp, HttpServletResponse.SC_BAD_REQUEST, "{\"error\":\"unknown action\"}");
                return;
        }

        sendJson(resp, HttpServletResponse.SC_OK, ok ? "{\"success\":true}" : "{\"success\":false}");
    }

    // ── 요청 파라미터 → Equipment 빌드 ──
    private Equipment buildEquipment(HttpServletRequest req, boolean withId) {
        Equipment.Builder b = Equipment.builder()
            .name(req.getParameter("name"))
            .location(req.getParameter("location"))
            .serialNo(req.getParameter("serialNo"))
            .status(req.getParameter("status"));

        String facId = req.getParameter("facilityId");
        if (facId != null && !facId.isBlank()) {
            b.facilityId(Long.parseLong(facId));
        }
        String mgrId = req.getParameter("managerId");
        if (mgrId != null && !mgrId.isBlank()) {
            b.managerId(Integer.parseInt(mgrId));
        }
        if (withId) {
            b.equipmentId(Long.parseLong(req.getParameter("equipmentId")));
        }
        return b.build();
    }

    private void sendJson(HttpServletResponse resp, int status, String body) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write(body);
    }
}
