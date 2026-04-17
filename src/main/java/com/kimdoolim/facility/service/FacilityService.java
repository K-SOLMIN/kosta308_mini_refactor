package com.kimdoolim.facility.service;

import com.kimdoolim.auth.dao.LoginDao;
import com.kimdoolim.dto.Facility;
import com.kimdoolim.dto.Permission;
import com.kimdoolim.dto.User;
import com.kimdoolim.facility.dao.FacilityDao;

import java.sql.Connection;
import java.util.Collections;
import java.util.List;

import static com.kimdoolim.common.Mysql.*;

public class FacilityService {

    private static final FacilityService instance = new FacilityService();
    private FacilityService() {}
    public static FacilityService getInstance() { return instance; }

    private final FacilityDao facilityDao = FacilityDao.getInstance();
    private final LoginDao loginDao = LoginDao.getInstance();

    public List<Facility> getAllFacilities() {
        Connection conn = getConnection();
        try {
            List<Facility> list = facilityDao.findAll(conn);
            return list != null ? list : Collections.emptyList();
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

    public boolean registerFacility(Facility facility) {
        Connection conn = getConnection();
        try {
            int result = facilityDao.save(conn, facility);
            if (result <= 0) { rollback(conn); return false; }

            // 담당자 권한 승격 (USER → MIDDLEADMIN)
            if (facility.getManagerId() != null) {
                loginDao.updatePermissionToMiddleAdmin(conn, facility.getManagerId());
            }
            commit(conn);
            return true;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    public boolean modifyFacility(Facility facility, User loginUser) {
        Connection conn = getConnection();
        try {
            // ── 권한 검증 ──────────────────────────────────────────────
            Facility existing = facilityDao.findById(conn, facility.getFacilityId());
            if (existing == null) return false;

            if (loginUser.getPermission() != Permission.ADMIN) {
                if (existing.getManagerId() == null || !existing.getManagerId().equals(loginUser.getUserId())) {
                    return false;
                }
            }
            // ────────────────────────────────────────────────────────────

            int result = facilityDao.update(conn, facility);
            if (result <= 0) { rollback(conn); return false; }

            // 담당자 권한 승격
            if (facility.getManagerId() != null) {
                loginDao.updatePermissionToMiddleAdmin(conn, facility.getManagerId());
            }
            commit(conn);
            return true;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    public boolean removeFacility(long facilityId, User loginUser) {
        Connection conn = getConnection();
        try {
            // ── 권한 검증 ──────────────────────────────────────────────
            Facility existing = facilityDao.findById(conn, facilityId);
            if (existing == null) return false;

            // 관리자가 아니면서, 본인이 담당하는 시설이 아닌 경우 거부
            if (loginUser.getPermission() != Permission.ADMIN) {
                if (existing.getManagerId() == null || !existing.getManagerId().equals(loginUser.getUserId())) {
                    return false;
                }
            }
            // ────────────────────────────────────────────────────────────

            int result = facilityDao.softDelete(conn, facilityId);
            if (result > 0) {
                commit(conn);
                return true;
            }
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
