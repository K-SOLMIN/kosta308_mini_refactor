package com.kimdoolim.common;

import com.kimdoolim.dto.User;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class AutoLoginManager {

    private static final ConcurrentHashMap<String, User> tokenToUser  = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<Integer, String> userToToken = new ConcurrentHashMap<>();

    private AutoLoginManager() {}

    /** 토큰 생성 및 등록 (기존 토큰 있으면 교체) */
    public static String generateToken(User user) {
        String old = userToToken.remove(user.getUserId());
        if (old != null) tokenToUser.remove(old);

        String token = UUID.randomUUID().toString();
        tokenToUser.put(token, user);
        userToToken.put(user.getUserId(), token);
        return token;
    }

    /** 토큰으로 User 조회 */
    public static User getUser(String token) {
        return tokenToUser.get(token);
    }

    /** 토큰으로 제거 */
    public static void removeByToken(String token) {
        User user = tokenToUser.remove(token);
        if (user != null) userToToken.remove(user.getUserId());
    }

    /** userId로 제거 */
    public static void removeByUserId(int userId) {
        String token = userToToken.remove(userId);
        if (token != null) tokenToUser.remove(token);
    }
}
