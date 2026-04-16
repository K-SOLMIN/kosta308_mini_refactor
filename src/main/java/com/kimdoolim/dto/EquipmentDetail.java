package com.kimdoolim.dto;

public class EquipmentDetail {

    private long   equipmentDetailId;
    private long   equipmentId;
    private String serialNo;
    private String status;       // 정상 | 수리 | 점검 | 분실
    private boolean checkDelete;

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private long    equipmentDetailId;
        private long    equipmentId;
        private String  serialNo;
        private String  status;
        private boolean checkDelete;

        public Builder equipmentDetailId(long v) { this.equipmentDetailId = v; return this; }
        public Builder equipmentId(long v)       { this.equipmentId = v;       return this; }
        public Builder serialNo(String v)        { this.serialNo = v;          return this; }
        public Builder status(String v)          { this.status = v;            return this; }
        public Builder checkDelete(boolean v)    { this.checkDelete = v;       return this; }

        public EquipmentDetail build() {
            EquipmentDetail d = new EquipmentDetail();
            d.equipmentDetailId = equipmentDetailId;
            d.equipmentId       = equipmentId;
            d.serialNo          = serialNo;
            d.status            = status;
            d.checkDelete       = checkDelete;
            return d;
        }
    }

    public long    getEquipmentDetailId() { return equipmentDetailId; }
    public long    getEquipmentId()       { return equipmentId; }
    public String  getSerialNo()          { return serialNo; }
    public String  getStatus()            { return status; }
    public boolean isCheckDelete()        { return checkDelete; }
}
