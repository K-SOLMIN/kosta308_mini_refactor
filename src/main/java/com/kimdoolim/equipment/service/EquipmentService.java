package com.kimdoolim.equipment.service;

import com.kimdoolim.auth.dao.LoginDao;
import com.kimdoolim.dto.Equipment;
import com.kimdoolim.dto.EquipmentDetail;
import com.kimdoolim.dto.Permission;
import com.kimdoolim.dto.User;
import com.kimdoolim.equipment.dao.EquipmentDao;
import com.kimdoolim.equipment.dao.EquipmentDetailDao;

import java.sql.Connection;
import java.util.*;


import static com.kimdoolim.common.Mysql.*;

public class EquipmentService {

    private static final EquipmentService instance = new EquipmentService();
    private EquipmentService() {}
    public static EquipmentService getInstance() { return instance; }

    private final EquipmentDao       equipmentDao       = EquipmentDao.getInstance();
    private final EquipmentDetailDao equipmentDetailDao = EquipmentDetailDao.getInstance();
    private final LoginDao           loginDao           = LoginDao.getInstance();

    // ── 비품 전체 조회 (낱개 포함 eager load) ───────────────────────
    public List<Equipment> getAllEquipments() {
        Connection conn = getConnection();
        try {
            List<Equipment> list = equipmentDao.findAll(conn);
            if (list == null) return Collections.emptyList();

            Map<Long, List<EquipmentDetail>> detailMap = equipmentDetailDao.findAllGrouped(conn);
            for (Equipment eq : list) {
                eq.setDetails(detailMap.getOrDefault(eq.getEquipmentId(), Collections.emptyList()));
            }
            return list;
        } finally {
            close(conn);
        }
    }

    // ── 전체 활성 사용자 조회 (담당자 배정용) ───────────────────────
    public List<User> getAllUsers() {
        Connection conn = getConnection();
        try {
            List<User> list = loginDao.findAllActiveUsers(conn);
            return list != null ? list : Collections.emptyList();
        } finally {
            close(conn);
        }
    }

    // ── 낱개 목록 조회 ───────────────────────────────────────────────
    public List<EquipmentDetail> getDetails(long equipmentId) {
        Connection conn = getConnection();
        try {
            List<EquipmentDetail> list = equipmentDetailDao.findByEquipmentId(conn, equipmentId);
            return list != null ? list : Collections.emptyList();
        } finally {
            close(conn);
        }
    }

    // ── 비품 등록 (단품) ─────────────────────────────────────────────
    public boolean registerEquipment(Equipment equipment) {
        Connection conn = getConnection();
        try {
            long newId = equipmentDao.saveAndGetId(conn, equipment);
            if (newId <= 0) { rollback(conn); return false; }

            // 시리얼번호 자동 부여
            if (equipment.getSerialNo() == null || equipment.getSerialNo().isBlank()) {
                equipmentDao.updateSerialNo(conn, newId, "EQ-" + newId);
            }
            // 담당자 권한 승격 (USER → MIDDLEADMIN)
            if (equipment.getManagerId() != null) {
                loginDao.updatePermissionToMiddleAdmin(conn, equipment.getManagerId());
            }

            commit(conn); return true;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    // ── 비품 등록 (세트: EQUIPMENT + EQUIPMENTDETAIL 낱개 N개) ───────
    public boolean registerEquipmentSet(Equipment equipment, int quantity) {
        Connection conn = getConnection();
        try {
            long newId = equipmentDao.saveAndGetId(conn, equipment);
            if (newId <= 0) { rollback(conn); return false; }

            String prefix = (equipment.getSerialNo() != null && !equipment.getSerialNo().isBlank())
                ? equipment.getSerialNo() : "EQ-" + newId;

            // 자동 시리얼이면 equipment 행에도 prefix 저장
            if (equipment.getSerialNo() == null || equipment.getSerialNo().isBlank()) {
                equipmentDao.updateSerialNo(conn, newId, prefix);
            }

            int inserted = equipmentDetailDao.bulkSave(conn, newId, prefix, quantity);
            if (inserted <= 0) { rollback(conn); return false; }

            // 담당자 권한 승격
            if (equipment.getManagerId() != null) {
                loginDao.updatePermissionToMiddleAdmin(conn, equipment.getManagerId());
            }

            commit(conn); return true;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    // ── 비품 수정 ────────────────────────────────────────────────────
    public boolean modifyEquipment(Equipment equipment, User loginUser) {
        Connection conn = getConnection();
        try {
            if (!canManageEquipment(conn, equipment.getEquipmentId(), loginUser)) {
                rollback(conn); return false;
            }

            int result = equipmentDao.update(conn, equipment);
            if (result <= 0) { rollback(conn); return false; }

            // 담당자 권한 승격
            if (equipment.getManagerId() != null) {
                loginDao.updatePermissionToMiddleAdmin(conn, equipment.getManagerId());
            }

            commit(conn); return true;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    // ── 비품 삭제 ────────────────────────────────────────────────────
    public boolean removeEquipment(long equipmentId, User loginUser) {
        Connection conn = getConnection();
        try {
            if (!canManageEquipment(conn, equipmentId, loginUser)) {
                rollback(conn); return false;
            }

            int result = equipmentDao.softDelete(conn, equipmentId);
            if (result > 0) { commit(conn); return true; }
            rollback(conn);
            return false;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    // ── 낱개 상태 변경 ───────────────────────────────────────────────
    public boolean updateDetailStatus(long detailId, String status, User loginUser) {
        Connection conn = getConnection();
        try {
            if (!canManageDetail(conn, detailId, loginUser)) {
                rollback(conn); return false;
            }

            int result = equipmentDetailDao.updateStatus(conn, detailId, status);
            if (result > 0) { commit(conn); return true; }
            rollback(conn);
            return false;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    // ── 낱개 1건 추가 ────────────────────────────────────────────────
    public EquipmentDetail addDetail(long equipmentId, String serialNo, User loginUser) {
        Connection conn = getConnection();
        try {
            if (!canManageEquipment(conn, equipmentId, loginUser)) {
                rollback(conn); return null;
            }

            EquipmentDetail detail = equipmentDetailDao.saveAndGet(conn, equipmentId, serialNo);
            if (detail != null) { commit(conn); return detail; }
            rollback(conn);
            return null;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    // ── 낱개 삭제 ────────────────────────────────────────────────────
    public boolean removeDetail(long detailId, User loginUser) {
        Connection conn = getConnection();
        try {
            if (!canManageDetail(conn, detailId, loginUser)) {
                rollback(conn); return false;
            }

            int result = equipmentDetailDao.softDelete(conn, detailId);
            if (result > 0) { commit(conn); return true; }
            rollback(conn);
            return false;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    // ── 권한 검증 헬퍼 ───────────────────────────────────────────────
    /** ADMIN이면 무조건 허용, MIDDLEADMIN이면 해당 비품의 담당자인지 DB 확인 */
    private boolean canManageEquipment(Connection conn, long equipmentId, User loginUser) {
        if (loginUser.getPermission() == Permission.ADMIN) return true;
        Equipment eq = equipmentDao.findById(conn, equipmentId);
        return eq != null
            && eq.getManagerId() != null
            && eq.getManagerId().equals(loginUser.getUserId());
    }

    /** ADMIN이면 무조건 허용, MIDDLEADMIN이면 낱개 → 부모 비품 → 담당자 DB 확인 */
    private boolean canManageDetail(Connection conn, long detailId, User loginUser) {
        if (loginUser.getPermission() == Permission.ADMIN) return true;
        Long equipmentId = equipmentDetailDao.findEquipmentIdByDetailId(conn, detailId);
        if (equipmentId == null) return false;
        Equipment eq = equipmentDao.findById(conn, equipmentId);
        return eq != null
            && eq.getManagerId() != null
            && eq.getManagerId().equals(loginUser.getUserId());
    }
}
