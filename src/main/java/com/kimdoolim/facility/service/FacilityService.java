package com.kimdoolim.facility.service;

import com.kimdoolim.auth.dao.LoginDao;
import com.kimdoolim.dto.Facility;
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

    public List<User> getAvailableManagers() {
        Connection conn = getConnection();
        try {
            List<User> list = loginDao.findMiddleAdmins(conn);
            return list != null ? list : Collections.emptyList();
        } finally {
            close(conn);
        }
    }

    public boolean registerFacility(Facility facility) {
        Connection conn = getConnection();
        try {
            int result = facilityDao.save(conn, facility);
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

    public boolean modifyFacility(Facility facility) {
        Connection conn = getConnection();
        try {
            int result = facilityDao.update(conn, facility);
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

    public boolean removeFacility(long facilityId) {
        Connection conn = getConnection();
        try {
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
