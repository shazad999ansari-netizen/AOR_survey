import sys
import os

# Configure stdout encoding to UTF-8 for Windows terminal compatibility
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from backend.main import app
from backend.db.session import init_db

def run_verification():
    print("=========================================================================")
    print("[TEST] STARTING AUTOMATED END-TO-END VERIFICATION: MOBILE FIELD PORTAL")
    print("=========================================================================")
    
    print("\n[STEP 1] Initializing Azure SQL Database schema & test accounts...")
    init_db()
    print("-> Azure SQL schema and default mobile accounts (+18005550199 & +18005550999) initialized.")

    client = TestClient(app)

    # Step 2: Test Mobile OTP Request via Azure Communication Services SMS Driver
    print("\n[STEP 2] Requesting 6-Digit OTP via /api/v1/auth/send-otp...")
    send_resp = client.post("/api/v1/auth/send-otp", json={"mobile_number": "+18005550199"})
    assert send_resp.status_code == 200, f"Send OTP failed: {send_resp.text}"
    otp_data = send_resp.json()
    demo_otp = otp_data["demo_otp_code"]
    print(f"-> Azure Communication Services SMS Dispatcher invoked for +18005550199. Test OTP Code: {demo_otp}")

    # Step 3: Test Invalid OTP Rejection
    print("\n[STEP 3] Testing Invalid OTP Rejection Guardrail...")
    bad_otp_resp = client.post("/api/v1/auth/verify-otp", json={"mobile_number": "+18005550199", "otp_code": "000000"})
    assert bad_otp_resp.status_code == 400, "Invalid OTP code was not rejected properly."
    print("-> Security check passed: Invalid 6-digit OTP code rejected with HTTP 400 Bad Request.")

    # Step 4: Test Valid OTP Verification & JWT Token Issuance
    print("\n[STEP 4] Verifying 6-Digit OTP via /api/v1/auth/verify-otp...")
    verify_resp = client.post("/api/v1/auth/verify-otp", json={"mobile_number": "+18005550199", "otp_code": demo_otp})
    assert verify_resp.status_code == 200, f"Verify OTP failed: {verify_resp.text}"
    token_data = verify_resp.json()
    engineer_token = token_data["access_token"]
    engineer_headers = {"Authorization": f"Bearer {engineer_token}"}
    print(f"-> OTP Verified! Authenticated Mobile: {token_data['user']['mobile_number']} (Role: {token_data['user']['role']}). JWT Session Issued.")

    # Step 5: Test RBAC Security Enforcement
    print("\n[STEP 5] Verifying RBAC Security Guardrails...")
    rbac_resp = client.get("/api/v1/admin/dashboard-stats", headers=engineer_headers)
    assert rbac_resp.status_code == 403, f"Expected 403 Forbidden for Field Engineer accessing admin stats, got {rbac_resp.status_code}"
    print("-> RBAC Enforced: Field Engineers restricted from exclusive Report Authenticator dashboard.")

    # Step 6: Test Tab 1 Store Survey Creation
    print("\n[STEP 6] Submitting Tab 1: Store Info & Hardware Audit...")
    survey_payload = {
        "store_name": "AOR MUAR-6090 Seawood",
        "repeater_present": True,
        "repeater_working": True,
        "repeater_photo_url": "/uploads/hardware/demo_repeater.jpg",
        "sc_present": True,
        "sc_working": True,
        "sc_photo_url": "/uploads/hardware/demo_smallcell.jpg"
    }
    survey_resp = client.post("/api/v1/surveys", json=survey_payload, headers=engineer_headers)
    assert survey_resp.status_code == 201, f"Survey creation failed: {survey_resp.text}"
    survey_id = survey_resp.json()["id"]
    print(f"-> Store survey registered in Azure SQL with ID: #SRV-{survey_id}.")

    # Step 7: Test Vision AI OCR Multi-Image Hotspot Extraction (Array of G-NetTrack + Speedtest)
    print("\n[STEP 7] Executing Vision AI OCR Multi-Image Extraction (/api/v1/extract-hotspot-data)...")
    files = [
        ("snap_5g", ("gnettrack_5g.jpg", b"fake_5g_telemetry_content", "image/jpeg")),
        ("snap_5g", ("speedtest_5g.jpg", b"fake_5g_speedtest_content", "image/jpeg")),
        ("snap_4g", ("gnettrack_4g.jpg", b"fake_4g_telemetry_content", "image/jpeg")),
        ("snap_4g", ("speedtest_4g.jpg", b"fake_4g_speedtest_content", "image/jpeg"))
    ]
    ocr_resp = client.post("/api/v1/extract-hotspot-data", data={"hotspot_name": "Hotspot 1: Entry gate left side"}, files=files, headers=engineer_headers)
    assert ocr_resp.status_code == 200, f"OCR failed: {ocr_resp.text}"
    ocr_result = ocr_resp.json()
    metrics = ocr_result["metrics"]
    print(f"-> Vision AI Extraction Success ({ocr_result['provider']})!")
    print(f"   5G Combined Telemetry: Band={metrics['band_5g']}, RSRP={metrics['rsrp_5g']} dBm, RSRQ={metrics['rsrq_5g']} dB, SINR={metrics['sinr_5g']} dB, DL={metrics['dl_mb_5g']} Mbps, Ping={metrics['ping_ms_5g']} ms")
    print(f"   4G Combined Telemetry: Band={metrics['band_4g']}, RSRP={metrics['rsrp_4g']} dBm, RSRQ={metrics['rsrq_4g']} dB, SINR={metrics['sinr_4g']} dB, DL={metrics['dl_mb_4g']} Mbps, Ping={metrics['ping_ms_4g']} ms")

    # Step 8: Test Saving Hotspot Reading to Azure SQL
    print("\n[STEP 8] Persisting Hotspot telemetry to Azure SQL...")
    hs_payload = {
        "hotspot_name": "Hotspot 1: Entry gate left side",
        **metrics,
        "snap_url_5g": ocr_result["snap_url_5g"],
        "snap_url_4g": ocr_result["snap_url_4g"]
    }
    hs_resp = client.post(f"/api/v1/surveys/{survey_id}/hotspots", json=hs_payload, headers=engineer_headers)
    assert hs_resp.status_code == 201, f"Save hotspot failed: {hs_resp.text}"
    print(f"-> Hotspot 1 telemetry saved to Azure SQL under Survey #SRV-{survey_id}.")

    # Step 9: Test WeasyPrint PDF & HTML Report Generation
    print("\n[STEP 9] Compiling Executive Audit PDF Report (WeasyPrint)...")
    html_resp = client.get(f"/api/v1/surveys/{survey_id}/preview-html", headers=engineer_headers)
    assert html_resp.status_code == 200 and "Executive Audit Report" in html_resp.text, "HTML Report generation failed"
    print("-> Interactive HTML Executive Report compiled successfully.")

    pdf_resp = client.get(f"/api/v1/surveys/{survey_id}/export-pdf", headers=engineer_headers)
    assert pdf_resp.status_code == 200, f"PDF export failed: {pdf_resp.status_code}"
    print(f"-> Executive PDF stream ready! (Media Type: {pdf_resp.headers.get('content-type')}, Size: {len(pdf_resp.content)} bytes).")

    # Step 10: Test Report Authenticator / Admin Dashboard
    print("\n[STEP 10] Authenticating Report Authenticator (+18005550999) & querying command center...")
    send_admin = client.post("/api/v1/auth/send-otp", json={"mobile_number": "+18005550999"}).json()
    verify_admin = client.post("/api/v1/auth/verify-otp", json={"mobile_number": "+18005550999", "otp_code": send_admin["demo_otp_code"]}).json()
    admin_headers = {"Authorization": f"Bearer {verify_admin['access_token']}"}

    stats_resp = client.get("/api/v1/admin/dashboard-stats", headers=admin_headers)
    assert stats_resp.status_code == 200, "Admin stats failed"
    stats = stats_resp.json()
    print(f"-> Report Authenticator Command Center Metrics:")
    print(f"   Completed Audits: {stats['total_surveys']}")
    print(f"   Monitored Hotspots: {stats['total_hotspots_monitored']}")
    print(f"   Repeater Health Rate: {stats['repeater_health_rate']}%")

    bulk_resp = client.get("/api/v1/admin/export-bulk-csv", headers=admin_headers)
    assert bulk_resp.status_code == 200 and "Store Site Name" in bulk_resp.text, "Bulk export failed"
    print("-> Enterprise Master Excel CSV export verified.")

    indiv_excel_resp = client.get(f"/api/v1/surveys/{survey_id}/export-excel", headers=admin_headers)
    assert indiv_excel_resp.status_code == 200 and "STORE INSPECTION AUDIT SUMMARY" in indiv_excel_resp.text, "Individual Excel export failed"
    print(f"-> Individual Survey #SRV-{survey_id} Excel export verified.")

    print("\n=========================================================================")
    print("[SUCCESS] ALL MOBILE-FIRST OTP & FIELD PORTAL TEST FLOWS PASSED PERFECTLY!")
    print("=========================================================================")

if __name__ == "__main__":
    run_verification()
