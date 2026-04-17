package com.kimdoolim.blockperiod.controller;

import com.kimdoolim.blockperiod.service.BlockPeriodService;
import com.kimdoolim.dto.BlockPeriod;
import com.kimdoolim.dto.BlockPeriodDetail;
import com.kimdoolim.dto.Facility;
import com.kimdoolim.dto.Permission;
import com.kimdoolim.dto.User;
import com.kimdoolim.equipment.service.EquipmentService;
import com.kimdoolim.dto.Equipment;
import com.kimdoolim.facility.service.FacilityService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.List;

@WebServlet("/blockperiod.do")
public class BlockPeriodServlet extends HttpServlet {

    private final BlockPeriodService blockPeriodService = BlockPeriodService.getInstance();
    private final FacilityService    facilityService    = FacilityService.getInstance();
    private final EquipmentService   equipmentService   = EquipmentService.getInstance();

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

        if (!isFetch) {
            resp.sendRedirect(req.getContextPath() + "/main.do");
            return;
        }

        List<BlockPeriod> blockPeriods = blockPeriodService.getAllBlockPeriods();
        List<Facility>    facilities   = facilityService.getAllFacilities();
        List<Equipment>   equipments   = equipmentService.getAllEquipments();

        boolean isAdmin = loginUser.getPermission() == Permission.ADMIN;

        req.setAttribute("isAdmin",       isAdmin);
        req.setAttribute("blockPeriods",  blockPeriods);
        req.setAttribute("facilities",    facilities);
        req.setAttribute("equipments",    equipments);
        req.getRequestDispatcher("/WEB-INF/views/fragments/blockperiodmanageviewresponse.jsp")
           .forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        req.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);
        User loginUser      = (session != null) ? (User) session.getAttribute("loginUser") : null;

        if (loginUser == null) { sendJson(resp, 401, "{\"error\":\"unauthorized\"}"); return; }
        if (loginUser.getPermission() != Permission.ADMIN) { sendJson(resp, 403, "{\"error\":\"forbidden\"}"); return; }

        String action = req.getParameter("action");
        boolean ok = false;

        switch (action == null ? "" : action) {
            case "save": {
                BlockPeriod bp = buildBlockPeriod(req, false);
                ok = blockPeriodService.registerBlockPeriod(bp);
                break;
            }
            case "update": {
                BlockPeriod bp = buildBlockPeriod(req, true);
                ok = blockPeriodService.modifyBlockPeriod(bp, loginUser);
                break;
            }
            case "delete":
                ok = blockPeriodService.removeBlockPeriod(
                    Long.parseLong(req.getParameter("blockPeriodId")), loginUser);
                break;
            case "addDetail": {
                long   bpId       = Long.parseLong(req.getParameter("blockPeriodId"));
                String targetType = req.getParameter("targetType");
                long   targetId   = Long.parseLong(req.getParameter("targetId"));

                if (!"FACILITY".equals(targetType) && !"EQUIPMENT".equals(targetType)) {
                    sendJson(resp, 400, "{\"error\":\"invalid targetType\"}");
                    return;
                }

                BlockPeriodDetail detail = blockPeriodService.addDetail(bpId, targetType, targetId, loginUser);
                if (detail != null) {
                    String name = detail.getTargetName() != null ? detail.getTargetName().replace("\"", "\\\"") : "";
                    sendJson(resp, 200,
                        "{\"success\":true,\"detail\":{" +
                        "\"id\":"         + detail.getBlockPeriodDetailId() + "," +
                        "\"targetType\":\"" + detail.getTargetType()        + "\"," +
                        "\"targetId\":"   + detail.getTargetId()            + "," +
                        "\"targetName\":\"" + name                          + "\"}}");
                } else {
                    sendJson(resp, 200, "{\"success\":false}");
                }
                return;
            }
            case "deleteDetail":
                ok = blockPeriodService.removeDetail(
                    Long.parseLong(req.getParameter("blockPeriodDetailId")), loginUser);
                break;
            default:
                sendJson(resp, 400, "{\"error\":\"unknown action\"}");
                return;
        }

        sendJson(resp, 200, ok ? "{\"success\":true}" : "{\"success\":false}");
    }

    // ── 파라미터 → BlockPeriod 빌드 ─────────────────────────────────
    private BlockPeriod buildBlockPeriod(HttpServletRequest req, boolean withId) {
        String startDate = req.getParameter("startDate");  // "yyyy-MM-dd"
        String startTime = req.getParameter("startTime");  // "HH:mm" or ""
        String endDate   = req.getParameter("endDate");
        String endTime   = req.getParameter("endTime");

        // 시간 미입력 시 종일 처리
        String startDatetime = startDate + " " + (isBlank(startTime) ? "00:00:00" : startTime + ":00");
        String endDatetime   = endDate   + " " + (isBlank(endTime)   ? "23:59:59" : endTime   + ":00");

        BlockPeriod.BlockPeriodBuilder b = BlockPeriod.builder()
            .title(req.getParameter("title"))
            .startDatetime(startDatetime)
            .endDatetime(endDatetime);

        if (withId) b.blockPeriodId(Long.parseLong(req.getParameter("blockPeriodId")));
        return b.build();
    }

    private boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }

    private void sendJson(HttpServletResponse resp, int status, String body) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json; charset=UTF-8");
        resp.getWriter().write(body);
    }
}
