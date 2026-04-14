package com.kimdoolim.dto;

public class Facility {

    private long   facilityId;
    private Integer managerId;          // nullable (담당자 없음)
    private String  managerName;        // LEFT JOIN user
    private String  location;
    private String  name;
    private int     maxCapacity;
    private String  maxReservationUnit; // 일 / 주 / 월
    private int     maxReservationValue;
    private boolean isDelete;
    private String  status;             // 정상 / 수리 / 점검

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private long    facilityId;
        private Integer managerId;
        private String  managerName;
        private String  location;
        private String  name;
        private int     maxCapacity;
        private String  maxReservationUnit;
        private int     maxReservationValue;
        private boolean isDelete;
        private String  status;

        public Builder facilityId(long v)           { this.facilityId = v;           return this; }
        public Builder managerId(Integer v)          { this.managerId = v;             return this; }
        public Builder managerName(String v)         { this.managerName = v;           return this; }
        public Builder location(String v)            { this.location = v;              return this; }
        public Builder name(String v)                { this.name = v;                  return this; }
        public Builder maxCapacity(int v)            { this.maxCapacity = v;           return this; }
        public Builder maxReservationUnit(String v)  { this.maxReservationUnit = v;    return this; }
        public Builder maxReservationValue(int v)    { this.maxReservationValue = v;   return this; }
        public Builder isDelete(boolean v)           { this.isDelete = v;              return this; }
        public Builder status(String v)              { this.status = v;                return this; }

        public Facility build() {
            Facility f = new Facility();
            f.facilityId          = facilityId;
            f.managerId           = managerId;
            f.managerName         = managerName;
            f.location            = location;
            f.name                = name;
            f.maxCapacity         = maxCapacity;
            f.maxReservationUnit  = maxReservationUnit;
            f.maxReservationValue = maxReservationValue;
            f.isDelete            = isDelete;
            f.status              = status;
            return f;
        }
    }

    public long    getFacilityId()           { return facilityId; }
    public Integer getManagerId()            { return managerId; }
    public String  getManagerName()          { return managerName; }
    public String  getLocation()             { return location; }
    public String  getName()                 { return name; }
    public int     getMaxCapacity()          { return maxCapacity; }
    public String  getMaxReservationUnit()   { return maxReservationUnit; }
    public int     getMaxReservationValue()  { return maxReservationValue; }
    public boolean isDelete()                { return isDelete; }
    public String  getStatus()               { return status; }

    @Override
    public String toString() {
        return "Facility{" +
                "id=" + facilityId +
                ", name='" + name + '\'' +
                ", location='" + location + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
}
