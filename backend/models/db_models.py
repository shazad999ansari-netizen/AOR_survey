from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "Users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    mobile_number = Column(String(50), unique=True, index=True, nullable=False)
    role = Column(String(50), nullable=False, default="engineer") # 'engineer', 'admin', 'manager'
    created_at = Column(DateTime, default=get_utc_now)

    surveys = relationship("StoreSurvey", back_populates="engineer", cascade="all, delete-orphan")


class OTPLog(Base):
    __tablename__ = "OTPLogs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    mobile_number = Column(String(50), index=True, nullable=False)
    otp_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)


class StoreSurvey(Base):
    __tablename__ = "StoreSurveys"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    store_name = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Hardware Audit Status & Photo Links
    repeater_present = Column(Boolean, default=False)
    repeater_working = Column(Boolean, default=False)
    repeater_photo_url = Column(String(1000), nullable=True)
    
    sc_present = Column(Boolean, default=False) # 5G Small Cell
    sc_working = Column(Boolean, default=False)
    sc_photo_url = Column(String(1000), nullable=True)

    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    engineer = relationship("User", back_populates="surveys")
    hotspots = relationship("HotspotReading", back_populates="survey", cascade="all, delete-orphan", order_by="HotspotReading.id")


class HotspotReading(Base):
    __tablename__ = "HotspotReadings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    survey_id = Column(Integer, ForeignKey("StoreSurveys.id", ondelete="CASCADE"), nullable=False, index=True)
    hotspot_name = Column(String(100), nullable=False)

    # 5G Parameters
    pci_5g = Column(Integer, nullable=True)
    rsrp_5g = Column(Float, nullable=True)
    dl_mb_5g = Column(Float, nullable=True)
    ul_mb_5g = Column(Float, nullable=True)
    gnb = Column(Integer, nullable=True)
    arfcn_5g = Column(Integer, nullable=True)

    # 4G Parameters
    enb = Column(Integer, nullable=True)
    cid = Column(Integer, nullable=True)
    arfcn_4g = Column(Integer, nullable=True)
    rsrp_4g = Column(Float, nullable=True)
    dl_mb_4g = Column(Float, nullable=True)
    ul_mb_4g = Column(Float, nullable=True)
    pci_4g = Column(Integer, nullable=True)

    # Visual proof Blob URLs
    snap_url_5g = Column(String(1000), nullable=True)
    snap_url_4g = Column(String(1000), nullable=True)

    created_at = Column(DateTime, default=get_utc_now)

    survey = relationship("StoreSurvey", back_populates="hotspots")
