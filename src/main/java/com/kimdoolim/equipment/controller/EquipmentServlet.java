package com.kimdoolim.equipment.controller;

import com.kimdoolim.dto.Equipment;
import com.kimdoolim.dto.EquipmentDetail;
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

        if (loginUser == null) {
            if (isFetch) sendJson(resp, 401, "{\"error\":\"unauthorized\"}");
            else         resp.sendRedirect(req.getContextPath() + "/index.jsp");
            return;
        }
        
        if (loginUser.getPermission() == Permission.USER) {
            if (isFetch) sendJson(resp, 403, "{\"error\":\"forbidden\"}");
            else         resp.sendRedirect(req.getContextPath() + "/main.do");
            return;
        }

        String action = req.getParameter("action");

        // ── 낱개 목록 AJAX 요청 ──────────────────────────────────────
        if ("details".equals(action)) {
            long equipmentId = Long.parseLong(req.getParameter("equipmentId"));
            List<EquipmentDetail> details = equipmentService.getDetails(equipmentId);
            sendJson(resp, 200, toDetailJson(details));
            return;
        }

        // ── 화면 요청 ────────────────────────────────────────────────
        if (!isFetch) {
            resp.sendRedirect(req.getContextPath() + "/main.do");
            return;
        }

        List<Equipment> equipments = equipmentService.getAllEquipments();
        List<User>      managers   = equipmentService.getAvailableManagers();

        Permission perm = loginUser.getPermission();
        if (perm == Permission.MIDDLEADMIN) {
            final Integer userId = loginUser.getUserId();
            equipments = equipments.stream()
                .filter(e -> e.getManagerId() != null && e.getManagerId().equals(userId))
                .toList();

            if (equipments.isEmpty()) {
                sendJson(resp, 403, "{\"error\":\"no_managed_equipment\"}");
                return;
            }
        }

        req.setAttribute("isAdmin",        perm == Permission.ADMIN);
        req.setAttribute("userPermission", perm.name().trim());
        req.setAttribute("equipments",     equipments);
        req.setAttribute("managers",       managers);
        req.getRequestDispatcher("/WEB-INF/views/fragments/equipmentmanageviewresponse.jsp")
           .forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        req.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);
        User loginUser      = (session != null) ? (User) session.getAttribute("loginUser") : null;

        if (loginUser == null) { sendJson(resp, 401, "{\"error\":\"unauthorized\"}"); return; }
        if (loginUser.getPermission() == Permission.USER) { sendJson(resp, 403, "{\"error\":\"forbidden\"}"); return; }

        String action = req.getParameter("action");
        boolean ok = false;

        switch (action == null ? "" : action) {
            case "save": {
                Equipment eq = buildEquipment(req, false);
                if (eq.isSet()) {
                    int qty = parseInt(req.getParameter("quantity"), 1);
                    ok = equipmentService.registerEquipmentSet(eq, qty);
                } else {
                    ok = equipmentService.registerEquipment(eq);
                }
                break;
            }
            case "update":
                ok = equipmentService.modifyEquipment(buildEquipment(req, true));
                break;
            case "delete":
                ok = equipmentService.removeEquipment(Long.parseLong(req.getParameter("equipmentId")));
                break;
            case "updateDetailStatus":
                ok = equipmentService.updateDetailStatus(
                    Long.parseLong(req.getParameter("equipmentDetailId")),
                    req.getParameter("status"));
                break;
            case "addDetail": {
                long eqId      = Long.parseLong(req.getParameter("equipmentId"));
                EquipmentDetail newDetail = equipmentService.addDetail(eqId, req.getParameter("serialNo"));
                if (newDetail != null) {
                    String ser = newDetail.getSerialNo() != null ? newDetail.getSerialNo().replace("\"", "\\\"") : "";
                    sendJson(resp, 200,
                        "{\"success\":true,\"detail\":{\"id\":" + newDetail.getEquipmentDetailId() +
                        ",\"serialNo\":\"" + ser + "\",\"status\":\"" + newDetail.getStatus() + "\"}}");
                } else {
                    sendJson(resp, 200, "{\"success\":false}");
                }
                return;
            }
            case "deleteDetail":
                ok = equipmentService.removeDetail(Long.parseLong(req.getParameter("equipmentDetailId")));
                break;
            default:
                sendJson(resp, 400, "{\"error\":\"unknown action\"}");
                return;
        }

        sendJson(resp, 200, ok ? "{\"success\":true}" : "{\"success\":false}");
    }

    // ── 파라미터 → Equipment 빌드 ────────────────────────────────────
    private Equipment buildEquipment(HttpServletRequest req, boolean withId) {
        Equipment.Builder b = Equipment.builder()
            .name(req.getParameter("name"))
            .location(req.getParameter("location"))
            .serialNo(req.getParameter("serialNo"))
            .status(req.getParameter("status"));

        String facId = req.getParameter("facilityId");
        if (facId != null && !facId.isBlank()) b.facilityId(Long.parseLong(facId));

        String mgrId = req.getParameter("managerId");
        if (mgrId != null && !mgrId.isBlank()) b.managerId(Integer.parseInt(mgrId));

        if (withId) b.equipmentId(Long.parseLong(req.getParameter("equipmentId")));
        return b.build();
    }

    // ── EquipmentDetail 리스트 → JSON ────────────────────────────────
    private String toDetailJson(List<EquipmentDetail> details) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < details.size(); i++) {
            EquipmentDetail d = details.get(i);
            String serial = d.getSerialNo() != null ? d.getSerialNo().replace("\"", "\\\"") : "";
            sb.append("{")
              .append("\"id\":").append(d.getEquipmentDetailId()).append(",")
              .append("\"equipmentId\":").append(d.getEquipmentId()).append(",")
              .append("\"serialNo\":\"").append(serial).append("\",")
              .append("\"status\":\"").append(d.getStatus()).append("\"")
              .append("}");
            if (i < details.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    private int parseInt(String val, int def) {
        try { return val != null ? Integer.parseInt(val) : def; }
        catch (NumberFormatException e) { return def; }
    }

    private void sendJson(HttpServletResponse resp, int status, String body) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write(body);
    }
}
