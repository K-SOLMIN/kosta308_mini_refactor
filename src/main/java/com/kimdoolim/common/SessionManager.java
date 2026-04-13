package com.kimdoolim.common;

import jakarta.servlet.http.HttpSession;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

public class SessionManager {

    private static final Map<Integer, HttpSession> sessionMap = new ConcurrentHashMap<>();

    private SessionManager() {}

    public static void register(int userId, HttpSession session) {
        sessionMap.put(userId, session);
    }

    public static void remove(int userId) {
        sessionMap.remove(userId);
    }

    /** 해당 userId의 활성 세션이 존재하는지 확인 */
    public static boolean hasActiveSession(int userId) {
        HttpSession session = sessionMap.get(userId);
        if (session == null) return false;
        try {
            session.getLastAccessedTime(); // 세션 만료 시 IllegalStateException
            return true;
        } catch (IllegalStateException e) {
            sessionMap.remove(userId);
            return false;
        }
    }

    /** 기존 세션 강제 무효화 */
    public static void invalidateExisting(int userId) {
        HttpSession session = sessionMap.remove(userId);
        if (session != null) {
            try {
                session.invalidate();
            } catch (IllegalStateException ignored) {}
        }
    }
}
