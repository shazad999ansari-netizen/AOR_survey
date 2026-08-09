import os
import io
import logging
from datetime import datetime, timezone
from typing import Optional, Any
from jinja2 import Environment, FileSystemLoader

from backend.core.config import settings

logger = logging.getLogger(__name__)

try:
    import weasyprint
    WEASYPRINT_AVAILABLE = True
except Exception as e:
    WEASYPRINT_AVAILABLE = False
    logger.warning(f"WeasyPrint library import warning ({e}). Fallback rendering mode enabled.")

class ReportService:
    def __init__(self):
        self.template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "templates")
        self.jinja_env = Environment(loader=FileSystemLoader(self.template_dir))
        self.css_path = os.path.join(self.template_dir, "report_style.css")

    def _resolve_photo_path(self, url_path: Optional[str]) -> str:
        """Resolves web snapshot URLs to local absolute file system paths or valid URLs for print engine."""
        if not url_path:
            return ""
        if url_path.startswith("http://") or url_path.startswith("https://") or url_path.startswith("data:image"):
            return url_path
        if url_path.startswith("/uploads/"):
            rel_name = url_path.replace("/uploads/", "")
            full_path = os.path.join(settings.LOCAL_UPLOAD_DIR, rel_name.replace("/", os.sep))
            if os.path.exists(full_path):
                return f"file:///{os.path.abspath(full_path).replace(os.sep, '/')}"
        return url_path

    def render_html_report(self, survey: Any, engineer_email: str = "engineer@telecom.com") -> str:
        """Renders the Jinja2 Executive Report HTML strings with embedded stylesheet and KPIs."""
        template = self.jinja_env.get_template("report_template.html")
        
        embed_css = ""
        if os.path.exists(self.css_path):
            with open(self.css_path, "r", encoding="utf-8") as f:
                embed_css = f.read()

        # Calculate Executive KPIs
        hotspots = survey.hotspots if hasattr(survey, "hotspots") and survey.hotspots else []
        total_hotspots = len(hotspots)
        
        avg_5g_rsrp = round(sum([h.rsrp_5g or -100.0 for h in hotspots]) / total_hotspots, 1) if total_hotspots > 0 else 0.0
        avg_5g_dl = round(sum([h.dl_mb_5g or 0.0 for h in hotspots]) / total_hotspots, 1) if total_hotspots > 0 else 0.0
        
        hw_ok = (survey.repeater_present and survey.repeater_working and survey.sc_present and survey.sc_working)
        hardware_status = "100% OPTIMAL" if hw_ok else "REVIEW NEEDED"

        # Prepare hotspot image sources
        # Prepare hotspot image sources
        prepared_hotspots = []
        for h in hotspots:
            enb_str = str(h.enb) if h.enb is not None else ""
            cid_str = str(h.cid) if h.cid is not None else ""
            if enb_str and cid_str:
                enb_cid_str = f"{enb_str}-{cid_str}"
            elif enb_str:
                enb_cid_str = enb_str
            elif cid_str:
                enb_cid_str = cid_str
            else:
                enb_cid_str = "-"

            h_dict = {
                "hotspot_name": h.hotspot_name,
                "pci_5g": h.pci_5g,
                "rsrp_5g": h.rsrp_5g,
                "dl_mb_5g": h.dl_mb_5g,
                "ul_mb_5g": h.ul_mb_5g,
                "gnb": h.gnb,
                "arfcn_5g": h.arfcn_5g,
                "enb": h.enb,
                "cid": h.cid,
                "enb_cid": enb_cid_str,
                "arfcn_4g": h.arfcn_4g,
                "rsrp_4g": h.rsrp_4g,
                "dl_mb_4g": h.dl_mb_4g,
                "ul_mb_4g": h.ul_mb_4g,
                "pci_4g": h.pci_4g,
                "snap_5g_src": self._resolve_photo_path(getattr(h, "snap_url_5g", None)),
                "snap_4g_src": self._resolve_photo_path(getattr(h, "snap_url_4g", None)),
            }
            prepared_hotspots.append(h_dict)

        date_str = (survey.created_at or datetime.now(timezone.utc)).strftime("%B %d, %Y - %H:%M UTC")

        html_out = template.render(
            survey=survey,
            engineer_email=engineer_email,
            date_str=date_str,
            embed_css=embed_css,
            total_hotspots=total_hotspots,
            avg_5g_rsrp=avg_5g_rsrp,
            avg_5g_dl=avg_5g_dl,
            hardware_status=hardware_status,
            repeater_photo_src=self._resolve_photo_path(getattr(survey, "repeater_photo_url", None)),
            sc_photo_src=self._resolve_photo_path(getattr(survey, "sc_photo_url", None)),
            hotspots=prepared_hotspots
        )
        return html_out

    def generate_pdf(self, survey: Any, engineer_email: str = "engineer@telecom.com") -> tuple[bytes, str]:
        """
        Compiles the survey audit report into a PDF binary via WeasyPrint.
        Returns a tuple of (binary_content, file_type) where file_type is 'application/pdf' or 'text/html' on fallback.
        """
        html_string = self.render_html_report(survey, engineer_email)
        
        if WEASYPRINT_AVAILABLE:
            try:
                pdf_bytes = weasyprint.HTML(
                    string=html_string, 
                    base_url=self.template_dir
                ).write_pdf()
                return (pdf_bytes, "application/pdf")
            except Exception as e:
                logger.error(f"WeasyPrint binary compilation failed ({e}). Returning high-fidelity HTML document instead.")
        
        # Fallback if Windows GTK DLLs are not preinstalled on machine
        return (html_string.encode('utf-8'), "text/html")

report_service = ReportService()
