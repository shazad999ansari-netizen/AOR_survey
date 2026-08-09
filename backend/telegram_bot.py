import os
import logging
import asyncio
import requests
from typing import Dict, Any
from sqlalchemy.orm import Session

from backend.db.session import SessionLocal
from backend.models.db_models import StoreSurvey, HotspotReading
from backend.services.vision_extractor import vision_extractor
from backend.services.report_service import report_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TelegramBot")

chat_sessions: Dict[int, Dict[str, Any]] = {}

def get_bot_token():
    return os.getenv("TELEGRAM_BOT_TOKEN", "").strip()

def send_telegram_message(bot_token: str, chat_id: int, text: str, reply_markup: dict = None):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    try:
        requests.post(url, json=payload, timeout=10)
    except Exception as e:
        logger.error(f"Failed to send Telegram message: {e}")

def send_telegram_document(bot_token: str, chat_id: int, file_bytes: bytes, filename: str, caption: str = ""):
    url = f"https://api.telegram.org/bot{bot_token}/sendDocument"
    files = {"document": (filename, file_bytes, "application/pdf")}
    data = {"chat_id": chat_id, "caption": caption, "parse_mode": "Markdown"}
    try:
        requests.post(url, data=data, files=files, timeout=30)
    except Exception as e:
        logger.error(f"Failed to send Telegram document: {e}")

def process_telegram_update(bot_token: str, update: dict):
    if "message" not in update:
        return

    msg = update["message"]
    chat_id = msg["chat"]["id"]
    text = msg.get("text", "").strip()

    if chat_id not in chat_sessions:
        chat_sessions[chat_id] = {"step": "IDLE", "store_name": None, "hotspots": []}

    session = chat_sessions[chat_id]

    if text in ["/start", "/new_survey", "/help"]:
        session["step"] = "AWAITING_STORE_NAME"
        session["hotspots"] = []
        welcome_text = (
            "⚡ *TELECOM STORE FIELD ENGINEER AUDIT BOT*\n\n"
            "Welcome! Send me your store survey screenshots (G-NetTrack & Speedtest photos) "
            "and Vision AI will auto-extract 5G RSRP, 4G Lncell id, DL/UL speeds and generate Executive PDF Reports!\n\n"
            "📍 *Step 1:* Please reply with your *Store Name / Site ID* (e.g. `AOR MUAR-6090 Seawood`):"
        )
        send_telegram_message(bot_token, chat_id, welcome_text)
        return

    if session["step"] == "AWAITING_STORE_NAME" and text and not text.startswith("/"):
        session["store_name"] = text
        session["step"] = "READY_FOR_PHOTOS"
        send_telegram_message(
            bot_token,
            chat_id,
            f"✅ Store set to *{text}*!\n\n"
            "📷 Now send me screenshots (G-NetTrack or Speedtest photos) one by one.\n"
            "Vision AI will extract 5G RSRP, 4G Lncell id, DL/UL speeds automatically!\n\n"
            "Commands:\n"
            "• `/report` - Generate & download Executive PDF Report\n"
            "• `/start` - Start a new store survey"
        )
        return

    if "photo" in msg and session["step"] == "READY_FOR_PHOTOS":
        send_telegram_message(bot_token, chat_id, "🔍 *Vision AI Processing...* Extracting telemetry & speed metrics...")
        
        photo_file_id = msg["photo"][-1]["file_id"]
        file_resp = requests.get(f"https://api.telegram.org/bot{bot_token}/getFile?file_id={photo_file_id}", timeout=10).json()
        file_path = file_resp["result"]["file_path"]
        img_bytes = requests.get(f"https://api.telegram.org/file/bot{bot_token}/{file_path}", timeout=20).content

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
        send_telegram_message(bot_token, chat_id, reply_text)
        return

    if text == "/report":
        if not session.get("store_name"):
            send_telegram_message(bot_token, chat_id, "⚠️ Please start a new survey first by typing `/start`.")
            return

        send_telegram_message(bot_token, chat_id, "⏳ *Compiling Executive PDF Report via WeasyPrint...*")

        db: Session = SessionLocal()
        try:
            survey = StoreSurvey(
                store_name=session["store_name"],
                user_id=1,
                repeater_present=True,
                repeater_working=True,
                sc_present=True,
                sc_working=True,
                remarks="Submitted via Telegram Bot (@aor_store_inspection_bot)"
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

            pdf_bytes, _ = report_service.generate_pdf(survey, engineer_email="telegram_bot@airtel.in")
            filename = f"Telegram_Audit_Report_{survey.id}_{survey.store_name.replace(' ', '_')}.pdf"
            send_telegram_document(bot_token, chat_id, pdf_bytes, filename, caption=f"🏆 Executive Audit PDF Report for *{survey.store_name}*")
        except Exception as e:
            logger.error(f"Telegram PDF Error: {e}")
            send_telegram_message(bot_token, chat_id, f"❌ PDF Generation Error: {e}")
        finally:
            db.close()
        return

async def run_telegram_bot_loop():
    token = get_bot_token()
    if not token or token == "YOUR_BOT_TOKEN_FROM_BOTFATHER":
        logger.warning("TELEGRAM_BOT_TOKEN environment variable not set. Bot loop skipped.")
        return

    logger.info(f"Starting Telegram Bot polling loop for @aor_store_inspection_bot...")
    offset = 0
    while True:
        try:
            url = f"https://api.telegram.org/bot{token}/getUpdates?offset={offset}&timeout=10"
            resp = await asyncio.to_thread(requests.get, url, timeout=15)
            data = resp.json()
            if data.get("ok"):
                for result in data["result"]:
                    offset = result["update_id"] + 1
                    process_telegram_update(token, result)
        except Exception as err:
            logger.error(f"Telegram Polling loop error: {err}")
        await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(run_telegram_bot_loop())
