package com.kimdoolim.dto;

public class Equipment {

    private long    equipmentId;
    private Long    facilityId;   // nullable
    private Integer managerId;    // nullable
    private String  managerName;  // LEFT JOIN user
    private String  facilityName; // LEFT JOIN facility
    private String  name;
    private String  location;
    private String  serialNo;
    private String  status;       // 정상 | 수리 | 점검
    private String  checkDelete;  // 'true' | 'false'

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private long    equipmentId;
        private Long    facilityId;
        private Integer managerId;
        private String  managerName;
        private String  facilityName;
        private String  name;
        private String  location;
        private String  serialNo;
        private String  status;
        private String  checkDelete;

        public Builder equipmentId(long v)    { this.equipmentId = v;    return this; }
        public Builder facilityId(Long v)     { this.facilityId = v;     return this; }
        public Builder managerId(Integer v)   { this.managerId = v;      return this; }
        public Builder managerName(String v)  { this.managerName = v;    return this; }
        public Builder facilityName(String v) { this.facilityName = v;   return this; }
        public Builder name(String v)         { this.name = v;           return this; }
        public Builder location(String v)     { this.location = v;       return this; }
        public Builder serialNo(String v)     { this.serialNo = v;       return this; }
        public Builder status(String v)       { this.status = v;         return this; }
        public Builder checkDelete(String v)  { this.checkDelete = v;    return this; }

        public Equipment build() {
            Equipment e = new Equipment();
            e.equipmentId  = equipmentId;
            e.facilityId   = facilityId;
            e.managerId    = managerId;
            e.managerName  = managerName;
            e.facilityName = facilityName;
            e.name         = name;
            e.location     = location;
            e.serialNo     = serialNo;
            e.status       = status;
            e.checkDelete  = checkDelete;
            return e;
        }
    }

    public long    getEquipmentId()  { return equipmentId; }
    public Long    getFacilityId()   { return facilityId; }
    public Integer getManagerId()    { return managerId; }
    public String  getManagerName()  { return managerName; }
    public String  getFacilityName() { return facilityName; }
    public String  getName()         { return name; }
    public String  getLocation()     { return location; }
    public String  getSerialNo()     { return serialNo; }
    public String  getStatus()       { return status; }
    public String  getCheckDelete()  { return checkDelete; }

    @Override
    public String toString() {
        return "Equipment{id=" + equipmentId + ", name='" + name + "', status='" + status + "'}";
    }
}
