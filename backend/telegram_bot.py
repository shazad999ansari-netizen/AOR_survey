import os
import logging
import asyncio
import io
import requests
from typing import Dict, Any
from sqlalchemy.orm import Session

from backend.db.session import SessionLocal
from backend.models.db_models import StoreSurvey, HotspotReading, User
from backend.services.vision_extractor import vision_extractor
from backend.services.report_service import report_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TelegramBot")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN_FROM_BOTFATHER")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

# Memory session state per chat_id
chat_sessions: Dict[int, Dict[str, Any]] = {}

def send_telegram_message(chat_id: int, text: str, reply_markup: dict = None):
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    try:
        requests.post(f"{TELEGRAM_API_URL}/sendMessage", json=payload)
    except Exception as e:
        logger.error(f"Failed to send Telegram message: {e}")

def send_telegram_document(chat_id: int, file_bytes: bytes, filename: str, caption: str = ""):
    files = {"document": (filename, file_bytes, "application/pdf")}
    data = {"chat_id": chat_id, "caption": caption, "parse_mode": "Markdown"}
    try:
        requests.post(f"{TELEGRAM_API_URL}/sendDocument", data=data, files=files)
    except Exception as e:
        logger.error(f"Failed to send Telegram document: {e}")

def process_telegram_update(update: dict):
    if "message" not in update:
        return

    msg = update["message"]
    chat_id = msg["chat"]["id"]
    text = msg.get("text", "").strip()

    if chat_id not in chat_sessions:
        chat_sessions[chat_id] = {"step": "IDLE", "store_name": None, "hotspots": []}

    session = chat_sessions[chat_id]

    # Command: /start or /new_survey
    if text in ["/start", "/new_survey", "/help"]:
        session["step"] = "AWAITING_STORE_NAME"
        session["hotspots"] = []
        welcome_text = (
            "⚡ *TELECOM STORE FIELD ENGINEER AUDIT BOT*\n\n"
            "Welcome! Send me your store survey photos (G-NetTrack & Speedtest screenshots) "
            "and I will automatically parse metrics, save to Azure SQL, and send you the Executive PDF Report!\n\n"
            "📍 *Step 1:* Please reply with your *Store Name / Site ID* (e.g. `AOR MUAR-6090 Seawood`):"
        )
        send_telegram_message(chat_id, welcome_text)
        return

    # Step 1: Store Name Entry
    if session["step"] == "AWAITING_STORE_NAME":
        session["store_name"] = text
        session["step"] = "READY_FOR_PHOTOS"
        send_telegram_message(
            chat_id,
            f"✅ Store set to *{text}*!\n\n"
            "📷 Now send me screenshots (G-NetTrack or Speedtest photos) one by one.\n"
            "Vision AI will extract 5G RSRP, 4G Lncell id, DL/UL speeds automatically!\n\n"
            "Commands:\n"
            "• `/report` - Generate & download Executive PDF Report\n"
            "• `/summary` - Get instant WhatsApp/Telegram text summary"
        )
        return

    # Step 2: Handle Attached Screenshots / Photos
    if "photo" in msg and session["step"] == "READY_FOR_PHOTOS":
        send_telegram_message(chat_id, "🔍 *Vision AI Processing...* Extracting telemetry & speed metrics...")
        
        # Get highest resolution photo
        photo_file_id = msg["photo"][-1]["file_id"]
        file_resp = requests.get(f"{TELEGRAM_API_URL}/getFile?file_id={photo_file_id}").json()
        file_path = file_resp["result"]["file_path"]
        img_bytes = requests.get(f"https://api.telegram.org/file/bot{TELEGRAM_BOT_TOKEN}/{file_path}").content

        # Run Vision AI Extraction
        ocr_result = vision_extractor.extract_telemetry_and_speeds(img_bytes)

        hs_name = f"Hotspot {len(session['hotspots']) + 1}"
        session["hotspots"].append({
            "name": hs_name,
            "metrics": ocr_result
        })

        r5 = ocr_result.get("rsrp_5g", ocr_result.get("rsrp", "-"))
        dl5 = ocr_result.get("dl_mb_5g", ocr_result.get("dl_mb", "-"))
        r4 = ocr_result.get("rsrp_4g", "-")
        dl4 = ocr_result.get("dl_mb_4g", "-")
        lncell = ocr_result.get("lncell_id", ocr_result.get("enb", "-"))

        reply_text = (
            f"✅ *{hs_name} Telemetry Extracted!*\n\n"
            f"📡 *5G:* DL {dl5} Mbps | RSRP: {r5} dBm\n"
            f"📶 *4G:* Lncell id: {lncell} | DL {dl4} Mbps | RSRP: {r4} dBm\n\n"
            "Send next screenshot or type `/report` to download PDF!"
        )
        send_telegram_message(chat_id, reply_text)
        return

    # Command: /report (Generate PDF Report)
    if text == "/report":
        if not session.get("store_name"):
            send_telegram_message(chat_id, "⚠️ Please start a new survey first by typing `/start`.")
            return

        send_telegram_message(chat_id, "⏳ *Compiling Executive PDF Report via WeasyPrint...*")

        # Save to DB
        db: Session = SessionLocal()
        try:
            survey = StoreSurvey(
                store_name=session["store_name"],
                user_id=1,  # Default Telegram User
                repeater_present=True,
                repeater_working=True,
                sc_present=True,
                sc_working=True,
                remarks="Submitted via Telegram Field Engineer Bot"
            )
            db.add(survey)
            db.commit()
            db.refresh(survey)

            for hs in session["hotspots"]:
                m = hs["metrics"]
                reading = HotspotReading(
                    survey_id=survey.id,
                    hotspot_name=hs["name"],
                    rsrp_5g=m.get("rsrp_5g"),
                    dl_mb_5g=m.get("dl_mb_5g"),
                    ul_mb_5g=m.get("ul_mb_5g"),
                    gnb=m.get("gnb"),
                    enb=m.get("enb"),
                    cid=m.get("cid"),
                    rsrp_4g=m.get("rsrp_4g"),
                    dl_mb_4g=m.get("dl_mb_4g"),
                    ul_mb_4g=m.get("ul_mb_4g")
                )
                db.add(reading)
            db.commit()
            db.refresh(survey)

            pdf_bytes, _ = report_service.generate_pdf(survey, engineer_email="telegram_engineer@airtel.in")
            filename = f"Telegram_Audit_Report_{survey.id}_{survey.store_name.replace(' ', '_')}.pdf"
            send_telegram_document(chat_id, pdf_bytes, filename, caption=f"🏆 Executive Audit PDF Report for *{survey.store_name}*")
        except Exception as e:
            logger.error(f"Telegram PDF Error: {e}")
            send_telegram_message(chat_id, f"❌ PDF Generation Error: {e}")
        finally:
            db.close()
        return

if __name__ == "__main__":
    logger.info("Telegram Bot Polling Started...")
    offset = 0
    while True:
        try:
            resp = requests.get(f"{TELEGRAM_API_URL}/getUpdates?offset={offset}&timeout=30").json()
            if resp.get("ok"):
                for result in resp["result"]:
                    offset = result["update_id"] + 1
                    process_telegram_update(result)
        except Exception as err:
            logger.error(f"Polling loop error: {err}")
            asyncio.sleep(5)
