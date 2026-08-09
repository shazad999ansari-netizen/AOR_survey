from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.models.db_models import StoreSurvey, HotspotReading, User
from backend.schemas.pydantic_schemas import StoreSurveyCreate, StoreSurveyUpdate, StoreSurveyResponse, StoreSurveyDetailedResponse
from backend.core.security import get_current_user, require_engineer
from backend.services.storage_service import storage_service

router = APIRouter(prefix="/surveys", tags=["Store Surveys & Hardware Audits"])

@router.post("", response_model=StoreSurveyResponse, status_code=status.HTTP_201_CREATED)
def create_store_survey(
    payload: StoreSurveyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_engineer)
) -> Any:
    """
    Creates Tab 1: Store Info & Hardware Audit in Azure SQL Database.
    Links hardware status toggles, photo uploads, and user session.
    """
    survey = StoreSurvey(
        store_name=payload.store_name,
        user_id=current_user.id,
        repeater_present=payload.repeater_present,
        repeater_working=payload.repeater_working,
        repeater_photo_url=payload.repeater_photo_url,
        sc_present=payload.sc_present,
        sc_working=payload.sc_working,
        sc_photo_url=payload.sc_photo_url,
        remarks=payload.remarks
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)

    if payload.hotspots:
        for h in payload.hotspots:
            reading = HotspotReading(
                survey_id=survey.id,
                hotspot_name=h.hotspot_name,
                pci_5g=h.pci_5g,
                rsrp_5g=h.rsrp_5g,
                dl_mb_5g=h.dl_mb_5g,
                ul_mb_5g=h.ul_mb_5g,
                gnb=h.gnb,
                arfcn_5g=h.arfcn_5g,
                enb=h.enb,
                cid=h.cid,
                arfcn_4g=h.arfcn_4g,
                rsrp_4g=h.rsrp_4g,
                dl_mb_4g=h.dl_mb_4g,
                ul_mb_4g=h.ul_mb_4g,
                pci_4g=h.pci_4g,
                snap_url_5g=h.snap_url_5g,
                snap_url_4g=h.snap_url_4g,
                remarks=h.remarks
            )
            db.add(reading)
        db.commit()
        db.refresh(survey)

    res = StoreSurveyResponse.model_validate(survey)
    res.engineer_mobile = current_user.mobile_number
    return res

@router.get("", response_model=List[StoreSurveyResponse])
def get_surveys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieves store surveys. Field engineers see their own audits; Report Authenticators / Admins monitor all audits.
    """
    if current_user.role in ["admin", "manager"]:
        surveys = db.query(StoreSurvey).order_by(StoreSurvey.created_at.desc()).all()
    else:
        surveys = db.query(StoreSurvey).filter(StoreSurvey.user_id == current_user.id).order_by(StoreSurvey.created_at.desc()).all()
    
    out = []
    for s in surveys:
        s_res = StoreSurveyResponse.model_validate(s)
        s_res.engineer_mobile = s.engineer.mobile_number if s.engineer else "Unknown Mobile"
        out.append(s_res)
    return out

@router.get("/{survey_id}", response_model=StoreSurveyDetailedResponse)
def get_survey_detail(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Retrieves detailed survey information including all Hotspots 1 through 6 telemetry logs."""
    survey = db.query(StoreSurvey).filter(StoreSurvey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requested Store Survey ID not found.")
    
    if current_user.role == "engineer" and survey.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    res = StoreSurveyDetailedResponse.model_validate(survey)
    res.engineer_mobile = survey.engineer.mobile_number if survey.engineer else "Unknown"
    return res

@router.put("/{survey_id}", response_model=StoreSurveyResponse)
def update_store_survey(
    survey_id: int,
    payload: StoreSurveyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_engineer)
) -> Any:
    """Updates hardware status toggles and photo URLs for an ongoing store survey."""
    survey = db.query(StoreSurvey).filter(StoreSurvey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store Survey ID not found.")
    
    if current_user.role == "engineer" and survey.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(survey, k, v)

    db.commit()
    db.refresh(survey)
    res = StoreSurveyResponse.model_validate(survey)
    res.engineer_mobile = current_user.mobile_number
    return res

@router.post("/upload-hardware-photo", status_code=status.HTTP_200_OK)
async def upload_hardware_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(require_engineer)
) -> dict[str, str]:
    """Uploads physical snap of Repeater or 5G Small Cell to Azure Blob Storage and returns URL."""
    url = await storage_service.upload_file(file, sub_directory="hardware")
    return {"photo_url": url, "filename": file.filename or "hardware_snap.jpg"}
