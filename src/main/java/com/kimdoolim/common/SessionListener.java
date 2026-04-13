package com.kimdoolim.common;

import com.kimdoolim.dto.User;
import jakarta.servlet.annotation.WebListener;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpSessionEvent;
import jakarta.servlet.http.HttpSessionListener;

@WebListener
public class SessionListener implements HttpSessionListener {

    @Override
    public void sessionDestroyed(HttpSessionEvent se) {
        HttpSession session = se.getSession();
        try {
            User user = (User) session.getAttribute("loginUser");
            if (user != null) {
                SessionManager.remove(user.getUserId());
            }
        } catch (Exception ignored) {}
    }
}
