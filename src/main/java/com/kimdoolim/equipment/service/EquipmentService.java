package com.kimdoolim.equipment.service;

import com.kimdoolim.auth.dao.LoginDao;
import com.kimdoolim.dto.Equipment;
import com.kimdoolim.dto.EquipmentDetail;
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

    // ── 담당자 목록 ──────────────────────────────────────────────────
    public List<User> getAvailableManagers() {
        Connection conn = getConnection();
        try {
            List<User> list = loginDao.findMiddleAdmins(conn);
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
            if (newId > 0) { commit(conn); return true; }
            rollback(conn);
            return false;
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

            String prefix = equipment.getSerialNo() != null ? equipment.getSerialNo() : "EQ-" + newId;
            int inserted  = equipmentDetailDao.bulkSave(conn, newId, prefix, quantity);
            if (inserted > 0) { commit(conn); return true; }

            rollback(conn);
            return false;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    // ── 비품 수정 ────────────────────────────────────────────────────
    public boolean modifyEquipment(Equipment equipment) {
        Connection conn = getConnection();
        try {
            int result = equipmentDao.update(conn, equipment);
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

    // ── 비품 삭제 (세트면 낱개도 CASCADE로 삭제됨) ───────────────────
    public boolean removeEquipment(long equipmentId) {
        Connection conn = getConnection();
        try {
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
    public boolean updateDetailStatus(long detailId, String status) {
        Connection conn = getConnection();
        try {
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

    // ── 낱개 1건 추가 (생성된 객체 반환) ────────────────────────────
    public EquipmentDetail addDetail(long equipmentId, String serialNo) {
        Connection conn = getConnection();
        try {
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
    public boolean removeDetail(long detailId) {
        Connection conn = getConnection();
        try {
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
}
