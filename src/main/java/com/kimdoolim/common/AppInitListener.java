package com.kimdoolim.common;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

import java.sql.Connection;

@WebListener
public class AppInitListener implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        // 앱 시작 시 HikariCP 풀을 미리 초기화 → 첫 로그인 지연 제거
        try (Connection conn = Mysql.getConnection()) {
            System.out.println("[AppInit] DB 커넥션 풀 워밍업 완료");
        } catch (Exception e) {
            System.err.println("[AppInit] DB 커넥션 풀 초기화 실패: " + e.getMessage());
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        // 앱 종료 시 풀 정리
        Mysql.closePool();
        System.out.println("[AppInit] DB 커넥션 풀 종료");
    }
}
