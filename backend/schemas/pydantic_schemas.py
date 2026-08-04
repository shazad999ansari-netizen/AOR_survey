from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

# --- Mobile OTP Auth Schemas ---
class SendOTPRequest(BaseModel):
    mobile_number: str = Field(..., description="Mobile phone number e.g. +18005550199 or 9876543210")

class VerifyOTPRequest(BaseModel):
    mobile_number: str = Field(..., description="Mobile phone number e.g. +18005550199 or 9876543210")
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-Digit numeric One Time Password")

class OTPResponse(BaseModel):
    success: bool
    message: str
    demo_otp_code: Optional[str] = Field(None, description="Test helper OTP code provided during dev testing mode")

class UserResponse(BaseModel):
    id: int
    mobile_number: str
    role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- OCR AI Extraction Schemas ---
class OCRExtractedParameters(BaseModel):
    # 5G Parameters (G-NetTrack + Speedtest combined)
    band_5g: Optional[str] = None
    rsrp_5g: Optional[float] = None
    rsrq_5g: Optional[float] = None
    sinr_5g: Optional[float] = None
    arfcn_5g: Optional[int] = None
    pci_5g: Optional[int] = None
    gnb: Optional[int] = None
    cid_5g: Optional[int] = None
    tac_5g: Optional[str] = None
    mcc_mnc_5g: Optional[str] = None
    dl_mb_5g: Optional[float] = None
    ul_mb_5g: Optional[float] = None
    ping_ms_5g: Optional[float] = None
    jitter_ms_5g: Optional[float] = None

    # 4G Parameters (G-NetTrack + Speedtest combined)
    band_4g: Optional[str] = None
    rsrp_4g: Optional[float] = None
    rsrq_4g: Optional[float] = None
    sinr_4g: Optional[float] = None
    arfcn_4g: Optional[int] = None
    pci_4g: Optional[int] = None
    enb: Optional[int] = None
    cid: Optional[int] = None
    tac_4g: Optional[str] = None
    mcc_mnc_4g: Optional[str] = None
    dl_mb_4g: Optional[float] = None
    ul_mb_4g: Optional[float] = None
    ping_ms_4g: Optional[float] = None
    jitter_ms_4g: Optional[float] = None

class OCRExtractionResponse(BaseModel):
    success: bool
    hotspot_name: Optional[str] = None
    metrics: OCRExtractedParameters
    raw_summary: Optional[str] = None
    provider: str = "Mock Vision OCR (Offline Engine)"
    snaps_url_5g: List[str] = []
    snaps_url_4g: List[str] = []

# --- Hotspot Readings Schemas ---
class HotspotReadingCreate(BaseModel):
    hotspot_name: str
    band_5g: Optional[str] = None
    rsrp_5g: Optional[float] = None
    rsrq_5g: Optional[float] = None
    sinr_5g: Optional[float] = None
    arfcn_5g: Optional[int] = None
    pci_5g: Optional[int] = None
    gnb: Optional[int] = None
    cid_5g: Optional[int] = None
    tac_5g: Optional[str] = None
    mcc_mnc_5g: Optional[str] = None
    dl_mb_5g: Optional[float] = None
    ul_mb_5g: Optional[float] = None
    ping_ms_5g: Optional[float] = None
    jitter_ms_5g: Optional[float] = None

    band_4g: Optional[str] = None
    rsrp_4g: Optional[float] = None
    rsrq_4g: Optional[float] = None
    sinr_4g: Optional[float] = None
    arfcn_4g: Optional[int] = None
    pci_4g: Optional[int] = None
    enb: Optional[int] = None
    cid: Optional[int] = None
    tac_4g: Optional[str] = None
    mcc_mnc_4g: Optional[str] = None
    dl_mb_4g: Optional[float] = None
    ul_mb_4g: Optional[float] = None
    ping_ms_4g: Optional[float] = None
    jitter_ms_4g: Optional[float] = None

    snap_url_5g: Optional[str] = None
    snap_url_4g: Optional[str] = None

class HotspotReadingResponse(HotspotReadingCreate):
    id: int
    survey_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Store Surveys Schemas ---
class StoreSurveyCreate(BaseModel):
    store_name: str = Field(..., description="Store Name e.g. AOR MUAR-6090 Seawood")
    repeater_present: bool = False
    repeater_working: bool = False
    repeater_photo_url: Optional[str] = None
    sc_present: bool = False
    sc_working: bool = False
    sc_photo_url: Optional[str] = None
    hotspots: Optional[List[HotspotReadingCreate]] = []

class StoreSurveyUpdate(BaseModel):
    store_name: Optional[str] = None
    repeater_present: Optional[bool] = None
    repeater_working: Optional[bool] = None
    repeater_photo_url: Optional[str] = None
    sc_present: Optional[bool] = None
    sc_working: Optional[bool] = None
    sc_photo_url: Optional[str] = None

class StoreSurveyResponse(BaseModel):
    id: int
    store_name: str
    user_id: int
    repeater_present: bool
    repeater_working: bool
    repeater_photo_url: Optional[str]
    sc_present: bool
    sc_working: bool
    sc_photo_url: Optional[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    engineer_mobile: Optional[str] = None

    class Config:
        from_attributes = True

class StoreSurveyDetailedResponse(StoreSurveyResponse):
    hotspots: List[HotspotReadingResponse] = []

    class Config:
        from_attributes = True

# --- Admin Dashboard Summary ---
class DashboardStats(BaseModel):
    total_surveys: int
    total_engineers: int
    total_hotspots_monitored: int
    repeater_health_rate: float
    smallcell_health_rate: float
    recent_surveys: List[StoreSurveyResponse]
