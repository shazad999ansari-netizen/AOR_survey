import csv
import io
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.models.db_models import StoreSurvey, HotspotReading, User
from backend.schemas.pydantic_schemas import StoreSurveyResponse
from backend.core.security import get_current_user, require_admin
from backend.services.report_service import report_service

router = APIRouter(tags=["Executive PDF Reports & Admin Analytics"])

@router.get("/surveys/{survey_id}/export-pdf", response_class=Response)
def export_survey_pdf(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Tab 8 Final Action: Consolidates Store Info, Hardware Status, and Network Metrics across Hotspots 1-6 
    into a unified Executive PDF Report generated via WeasyPrint.
    """
    survey = db.query(StoreSurvey).filter(StoreSurvey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store Survey ID not found.")

    if current_user.role == "engineer" and survey.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    engineer_mobile = survey.engineer.mobile_number if survey.engineer else "+18005550199"
    
    file_bytes, media_type = report_service.generate_pdf(survey, engineer_email=engineer_mobile)
    
    ext = "pdf" if media_type == "application/pdf" else "html"
    filename = f"Audit_Report_Store_{survey.id}_{survey.store_name.replace(' ', '_')}.{ext}"

    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/surveys/{survey_id}/preview-html", response_class=HTMLResponse)
def get_survey_html_preview(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Returns interactive high-fidelity HTML report preview for Tab 8 embedding within the mobile UI."""
    survey = db.query(StoreSurvey).filter(StoreSurvey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store Survey not found.")

    if current_user.role == "engineer" and survey.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    engineer_mobile = survey.engineer.mobile_number if survey.engineer else "+18005550199"
    html_content = report_service.render_html_report(survey, engineer_email=engineer_mobile)
    return HTMLResponse(content=html_content)

@router.get("/surveys/{survey_id}/export-excel", response_class=Response)
def export_individual_survey_excel(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Owner & Engineer Route: Exports individual store survey with all hotspot telemetry readings as an Excel CSV file."""
    survey = db.query(StoreSurvey).filter(StoreSurvey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store Survey ID not found.")

    if current_user.role == "engineer" and survey.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Store Summary Section
    writer.writerow(["=== STORE INSPECTION AUDIT SUMMARY ==="])
    writer.writerow(["Survey ID", survey.id])
    writer.writerow(["Store Site Name", survey.store_name])
    writer.writerow(["Field Engineer Mobile", survey.engineer.mobile_number if survey.engineer else "N/A"])
    writer.writerow(["Repeater Installed", "YES" if survey.repeater_present else "NO"])
    writer.writerow(["Repeater Operational", "YES" if survey.repeater_working else "NO"])
    writer.writerow(["Repeater Photo URL", survey.repeater_photo_url or "N/A"])
    writer.writerow(["5G Small Cell Installed", "YES" if survey.sc_present else "NO"])
    writer.writerow(["5G Small Cell Operational", "YES" if survey.sc_working else "NO"])
    writer.writerow(["5G SC Photo URL", survey.sc_photo_url or "N/A"])
    writer.writerow(["Audit Created Timestamp", survey.created_at.strftime("%Y-%m-%d %H:%M:%S") if survey.created_at else "N/A"])
    writer.writerow([])
    
    # Hotspot Telemetry Section
    writer.writerow(["=== HOTSPOT RF TELEMETRY & SPEEDTEST READINGS ==="])
    writer.writerow([
        "Hotspot Name", 
        "5G Band", "5G PCI", "5G RSRP (dBm)", "5G RSRQ (dB)", "5G SINR (dB)", "5G ARFCN", "5G Cell ID", "5G DL (Mbps)", "5G UL (Mbps)", "5G Ping (ms)",
        "4G Band", "4G PCI", "4G RSRP (dBm)", "4G RSRQ (dB)", "4G SINR (dB)", "4G ARFCN", "4G Cell ID", "4G DL (Mbps)", "4G UL (Mbps)", "4G Ping (ms)",
        "5G Proof URL", "4G Proof URL"
    ])
    
    for h in (survey.hotspots or []):
        writer.writerow([
            h.hotspot_name,
            getattr(h, 'band_5g', 'n78'), h.pci_5g or 'N/A', h.rsrp_5g or 'N/A', getattr(h, 'rsrq_5g', 'N/A'), getattr(h, 'sinr_5g', 'N/A'), h.arfcn_5g or 'N/A', getattr(h, 'cid_5g', None) or h.gnb or 'N/A', h.dl_mb_5g or '0', h.ul_mb_5g or '0', getattr(h, 'ping_ms_5g', 'N/A'),
            getattr(h, 'band_4g', 'B3'), h.pci_4g or 'N/A', h.rsrp_4g or 'N/A', getattr(h, 'rsrq_4g', 'N/A'), getattr(h, 'sinr_4g', 'N/A'), h.arfcn_4g or 'N/A', h.cid or h.enb or 'N/A', h.dl_mb_4g or '0', h.ul_mb_4g or '0', getattr(h, 'ping_ms_4g', 'N/A'),
            h.snap_url_5g or 'N/A', h.snap_url_4g or 'N/A'
        ])

    filename = f"Survey_#{survey.id}_{survey.store_name.replace(' ', '_')}_Excel_Export.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

# --- Executive Manager & Report Authenticator Analytical Dashboard Endpoints ---

@router.get("/admin/dashboard-stats", response_model=dict)
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
) -> Any:
    """Manager / Report Authenticator exclusive route: Retrieves operational KPI metrics and full store audits with hotspots."""
    total_surveys = db.query(StoreSurvey).count()
    total_engineers = db.query(User).filter(User.role == "engineer").count()
    total_hotspots_monitored = db.query(HotspotReading).count()

    repeater_working_cnt = db.query(StoreSurvey).filter(StoreSurvey.repeater_working == True).count()
    sc_working_cnt = db.query(StoreSurvey).filter(StoreSurvey.sc_working == True).count()

    rep_rate = round((repeater_working_cnt / total_surveys * 100.0), 1) if total_surveys > 0 else 100.0
    sc_rate = round((sc_working_cnt / total_surveys * 100.0), 1) if total_surveys > 0 else 100.0

    all_surveys = db.query(StoreSurvey).order_by(StoreSurvey.created_at.desc()).all()
    surveys_out = []
    for s in all_surveys:
        s_dict = {
            "id": s.id,
            "store_name": s.store_name,
            "user_id": s.user_id,
            "engineer_mobile": s.engineer.mobile_number if s.engineer else "Unknown Mobile",
            "repeater_present": s.repeater_present,
            "repeater_working": s.repeater_working,
            "repeater_photo_url": s.repeater_photo_url,
            "sc_present": s.sc_present,
            "sc_working": s.sc_working,
            "sc_photo_url": s.sc_photo_url,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            "hotspots_count": len(s.hotspots or []),
            "hotspots": [
                {
                    "id": h.id,
                    "hotspot_name": h.hotspot_name,
                    "pci_5g": h.pci_5g,
                    "rsrp_5g": h.rsrp_5g,
                    "dl_mb_5g": h.dl_mb_5g,
                    "ul_mb_5g": h.ul_mb_5g,
                    "pci_4g": h.pci_4g,
                    "rsrp_4g": h.rsrp_4g,
                    "dl_mb_4g": h.dl_mb_4g,
                    "ul_mb_4g": h.ul_mb_4g
                } for h in (s.hotspots or [])
            ]
        }
        surveys_out.append(s_dict)

    return {
        "total_surveys": total_surveys,
        "total_engineers": total_engineers,
        "total_hotspots_monitored": total_hotspots_monitored,
        "repeater_health_rate": rep_rate,
        "smallcell_health_rate": sc_rate,
        "recent_surveys": surveys_out
    }

@router.get("/admin/export-bulk-csv", response_class=Response)
def export_bulk_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
) -> Any:
    """Manager / Report Authenticator exclusive route: Exports enterprise RF audit dataset as comprehensive Excel CSV."""
    surveys = db.query(StoreSurvey).order_by(StoreSurvey.created_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Survey ID", "Store Site Name", "Field Engineer Mobile", 
        "Repeater Present", "Repeater Working", "Repeater Photo URL",
        "5G SC Present", "5G SC Working", "5G SC Photo URL",
        "Total Hotspots Monitored", 
        "Hotspot 1 Name", "H1 5G RSRP (dBm)", "H1 5G DL (Mbps)", "H1 5G UL (Mbps)", "H1 4G RSRP (dBm)", "H1 4G DL (Mbps)",
        "Hotspot 2 Name", "H2 5G RSRP (dBm)", "H2 5G DL (Mbps)", "H2 5G UL (Mbps)", "H2 4G RSRP (dBm)", "H2 4G DL (Mbps)",
        "Hotspot 3 Name", "H3 5G RSRP (dBm)", "H3 5G DL (Mbps)", "H3 5G UL (Mbps)", "H3 4G RSRP (dBm)", "H3 4G DL (Mbps)",
        "Audit Created Date & Time"
    ])
    
    for s in surveys:
        hotspots = s.hotspots or []
        h_cnt = len(hotspots)
        eng = s.engineer.mobile_number if s.engineer else "N/A"
        date_str = s.created_at.strftime("%Y-%m-%d %H:%M:%S") if s.created_at else "N/A"
        
        row = [
            s.id, s.store_name, eng,
            "YES" if s.repeater_present else "NO", "YES" if s.repeater_working else "NO", s.repeater_photo_url or "N/A",
            "YES" if s.sc_present else "NO", "YES" if s.sc_working else "NO", s.sc_photo_url or "N/A",
            h_cnt
        ]

        # Expand Hotspots 1, 2, 3 into columns for Excel sheet
        for idx in range(3):
            if idx < len(hotspots):
                h = hotspots[idx]
                row.extend([
                    h.hotspot_name, 
                    h.rsrp_5g or "N/A", h.dl_mb_5g or "0", h.ul_mb_5g or "0",
                    h.rsrp_4g or "N/A", h.dl_mb_4g or "0"
                ])
            else:
                row.extend(["N/A", "N/A", "N/A", "N/A", "N/A", "N/A"])

        row.append(date_str)
        writer.writerow(row)
        
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="Enterprise_Master_Store_Audit_Spreadsheet.csv"'}
    )
