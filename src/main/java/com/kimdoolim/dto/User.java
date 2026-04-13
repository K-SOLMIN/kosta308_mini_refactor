package com.kimdoolim.dto;

public class User {
    private int userId;
    private int schoolId;
    private String id;
    private String password;
    private Permission permission;
    private String name;
    private String phone;
    private int gradeNo;
    private int classNo;
    private boolean isActive;
    private UserStatus userStatus; // 활성 | 휴직 | 전근

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int userId;
        private int schoolId;
        private String id;
        private String password;
        private Permission permission;
        private String name;
        private String phone;
        private int gradeNo;
        private int classNo;
        private boolean isActive;
        private UserStatus userStatus;

        public Builder userId(int userId)                { this.userId = userId; return this; }
        public Builder schoolId(int schoolId)            { this.schoolId = schoolId; return this; }
        public Builder id(String id)                     { this.id = id; return this; }
        public Builder password(String password)         { this.password = password; return this; }
        public Builder permission(Permission permission) { this.permission = permission; return this; }
        public Builder name(String name)                 { this.name = name; return this; }
        public Builder phone(String phone)               { this.phone = phone; return this; }
        public Builder gradeNo(int gradeNo)              { this.gradeNo = gradeNo; return this; }
        public Builder classNo(int classNo)              { this.classNo = classNo; return this; }
        public Builder isActive(boolean isActive)        { this.isActive = isActive; return this; }
        public Builder userStatus(UserStatus userStatus) { this.userStatus = userStatus; return this; }

        public User build() {
            User user = new User();
            user.userId     = this.userId;
            user.schoolId   = this.schoolId;
            user.id         = this.id;
            user.password   = this.password;
            user.permission = this.permission;
            user.name       = this.name;
            user.phone      = this.phone;
            user.gradeNo    = this.gradeNo;
            user.classNo    = this.classNo;
            user.isActive   = this.isActive;
            user.userStatus = this.userStatus;
            return user;
        }
    }

    public int getUserId()            { return userId; }
    public int getSchoolId()          { return schoolId; }
    public String getId()             { return id; }
    public String getPassword()       { return password; }
    public Permission getPermission() { return permission; }
    public String getName()           { return name; }
    public String getPhone()          { return phone; }
    public int getGradeNo()           { return gradeNo; }
    public int getClassNo()           { return classNo; }
    public boolean isActive()         { return isActive; }
    public UserStatus getUserStatus()  { return userStatus; }
}
