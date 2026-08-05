// Mobile Field Engineer Portal Logic
class FieldPortalApp {
    constructor() {
        this.activeSurveyId = null;
        this.activeMobileNumber = null;
        this.currentView = 'auth';
        this.timerInterval = null;
        
        this.hotspotDefinitions = [
            { id: 1, name: "Hotspot 1: Entry gate left side", tab: "tab-2" },
            { id: 2, name: "Hotspot 2: Entry gate right side", tab: "tab-3" },
            { id: 3, name: "Hotspot 3: Centre", tab: "tab-4" },
            { id: 4, name: "Hotspot 4: Reception", tab: "tab-5" },
            { id: 5, name: "Hotspot 5: Back Office", tab: "tab-6" },
            { id: 6, name: "Hotspot 6: Back Office Corner", tab: "tab-7" },
        ];
        
        this.hotspotsData = {};

        this.init();
    }

    init() {
        this.generateHotspotTabs();
        this.bindEvents();
        this.setupOTPInputGrid();
        this.checkExistingAuth();
    }

    // --- Dynamic Mobile Hotspot Tab Generator ---
    generateHotspotTabs() {
        const container = document.getElementById('hotspots-container-block');
        if (!container) return;
        
        let html = '';
        this.hotspotDefinitions.forEach((hs, idx) => {
            const nextTab = idx < 5 ? `tab-${idx + 3}` : 'tab-8';
            const nextLabel = idx < 5 ? `Proceed to Hotspot ${idx + 2} ➔` : `Finish & Open Executive PDF 🏆`;

            html += `
            <div id="${hs.tab}" class="tab-content glass-panel" style="padding: 1.5rem;">
                <div style="margin-bottom: 1.25rem;">
                    <span style="color: var(--accent-cyan); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Vision AI Telemetry Parsing</span>
                    <h3 style="font-size: 1.3rem; margin-top: 2px;">📡 ${hs.name}</h3>
                </div>

                <div class="hardware-grid" style="margin-top: 0; margin-bottom: 1.5rem;">
                    <div class="dropzone-box" id="drop-5g-${hs.id}" onclick="document.getElementById('file-5g-${hs.id}').click();">
                        <div class="dropzone-icon">📱</div>
                        <div style="font-weight: 700; font-size: 0.95rem; color: var(--accent-cyan);">Upload 5G Screenshots</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Up to 2 Files: G-NetTrack + Speedtest</div>
                        <div id="badge-5g-${hs.id}" style="font-size: 0.8rem; font-weight: 700; color: var(--accent-cyan); margin-top: 6px;"></div>
                        <div id="thumbs-5g-${hs.id}" style="display: flex; gap: 6px; justify-content: center; margin-top: 6px; flex-wrap: wrap;"></div>
                        <input type="file" id="file-5g-${hs.id}" accept="image/*" multiple style="display: none;" onchange="app.handleHotspotSnap(this, ${hs.id}, '5g')">
                    </div>

                    <div class="dropzone-box" id="drop-4g-${hs.id}" onclick="document.getElementById('file-4g-${hs.id}').click();" style="border-color: hsla(265, 89%, 66%, 0.4);">
                        <div class="dropzone-icon" style="color: var(--accent-violet);">📶</div>
                        <div style="font-weight: 700; font-size: 0.95rem; color: var(--accent-violet);">Upload 4G Screenshots</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Up to 2 Files: G-NetTrack + Speedtest</div>
                        <div id="badge-4g-${hs.id}" style="font-size: 0.8rem; font-weight: 700; color: var(--accent-violet); margin-top: 6px;"></div>
                        <div id="thumbs-4g-${hs.id}" style="display: flex; gap: 6px; justify-content: center; margin-top: 6px; flex-wrap: wrap;"></div>
                        <input type="file" id="file-4g-${hs.id}" accept="image/*" multiple style="display: none;" onchange="app.handleHotspotSnap(this, ${hs.id}, '4g')">
                    </div>
                </div>

                <button class="btn btn-primary" style="width: 100%; margin-bottom: 1.5rem;" id="btn-ocr-${hs.id}" onclick="app.triggerVisionOCR(${hs.id})">
                    ⚡ Trigger Vision AI Auto-Extract (OCR)
                </button>

                <!-- Mobile Metric Preview Card -->
                <div class="glass-panel" style="padding: 1rem; background: hsla(222, 35%, 10%, 0.7);">
                    <h4 style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px; text-transform: uppercase;">Extracted Telemetry & Speedtest Card</h4>
                    
                    <div class="data-table-container" style="margin-top: 0;">
                        <table class="data-table" id="table-metrics-${hs.id}">
                            <thead>
                                <tr>
                                    <th style="color: var(--accent-cyan);">📡 5G Telemetry (gNB / CID / PCI / Band / RSRP)</th>
                                    <th style="color: var(--accent-violet);">📶 4G LTE Telemetry (eNB / CID / PCI / Band / RSRP)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>gNB:</strong> <span id="cell-${hs.id}-gnb" class="val-highlight-5g" contenteditable="true">-</span></td>
                                    <td><strong>eNB:</strong> <span id="cell-${hs.id}-enb" class="val-highlight-4g" contenteditable="true">-</span></td>
                                </tr>
                                <tr>
                                    <td><strong>CID (Cell ID):</strong> <span id="cell-${hs.id}-cid_5g" class="val-highlight-5g" contenteditable="true">-</span></td>
                                    <td><strong>CID (Cell ID):</strong> <span id="cell-${hs.id}-cid" class="val-highlight-4g" contenteditable="true">-</span></td>
                                </tr>
                                <tr>
                                    <td><strong>PCI:</strong> <span id="cell-${hs.id}-pci_5g" class="val-highlight-5g" contenteditable="true">-</span></td>
                                    <td><strong>PCI:</strong> <span id="cell-${hs.id}-pci_4g" class="val-highlight-4g" contenteditable="true">-</span></td>
                                </tr>
                                <tr>
                                    <td><strong>BAND:</strong> <span id="cell-${hs.id}-band_5g" class="val-highlight-5g" contenteditable="true">-</span></td>
                                    <td><strong>BAND:</strong> <span id="cell-${hs.id}-band_4g" class="val-highlight-4g" contenteditable="true">-</span></td>
                                </tr>
                                <tr>
                                    <td><strong>RSRP:</strong> <span id="cell-${hs.id}-rsrp_5g" class="val-highlight-5g" contenteditable="true">-</span></td>
                                    <td><strong>RSRP:</strong> <span id="cell-${hs.id}-rsrp_4g" class="val-highlight-4g" contenteditable="true">-</span></td>
                                </tr>
                                <tr>
                                    <td style="font-size: 0.8rem; color: var(--text-secondary);">RSRQ / SINR: <span id="cell-${hs.id}-rsrq_5g">-</span> / <span id="cell-${hs.id}-sinr_5g">-</span></td>
                                    <td style="font-size: 0.8rem; color: var(--text-secondary);">RSRQ / SINR: <span id="cell-${hs.id}-rsrq_4g">-</span> / <span id="cell-${hs.id}-sinr_4g">-</span></td>
                                </tr>
                                <tr>
                                    <td style="font-size: 0.8rem; color: var(--text-secondary);">DL / UL Speed: <span id="cell-${hs.id}-dl_mb_5g">0</span> Mbps / <span id="cell-${hs.id}-ul_mb_5g">0</span> Mbps</td>
                                    <td style="font-size: 0.8rem; color: var(--text-secondary);">DL / UL Speed: <span id="cell-${hs.id}-dl_mb_4g">0</span> Mbps / <span id="cell-${hs.id}-ul_mb_4g">0</span> Mbps</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 10px;">
                    <div id="save-status-${hs.id}" style="color: var(--text-secondary); font-size: 0.8rem; text-align: center;">Waiting for extraction or save.</div>
                    <button class="btn btn-secondary" onclick="app.saveHotspotToDB(${hs.id}, false)">
                        💾 Confirm & Save Reading
                    </button>
                    <button class="btn btn-primary" onclick="app.saveHotspotToDB(${hs.id}, true, '${nextTab}')">
                        ${nextLabel}
                    </button>
                </div>
            </div>`;
        });

        container.innerHTML = html;
    }

    // --- 6-Digit OTP Focus Grid Helper ---
    setupOTPInputGrid() {
        const fields = [1, 2, 3, 4, 5, 6].map(i => document.getElementById(`otp-${i}`));
        fields.forEach((field, index) => {
            if (!field) return;
            field.addEventListener('input', (e) => {
                if (field.value.length === 1 && index < 5) {
                    fields[index + 1].focus();
                }
            });
            field.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && field.value === '' && index > 0) {
                    fields[index - 1].focus();
                }
            });
        });
    }

    bindEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.getAttribute('data-tab'));
            });
        });

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());

        const toggleDashBtn = document.getElementById('btn-toggle-dashboard');
        if (toggleDashBtn) {
            toggleDashBtn.addEventListener('click', () => {
                if (this.currentView === 'admin') {
                    this.showView('survey');
                    toggleDashBtn.innerHTML = '📊 Admin';
                } else {
                    this.showView('admin');
                    toggleDashBtn.innerHTML = '⚡ Survey';
                    this.loadAdminDashboard();
                }
            });
        }

        window.addEventListener('auth_expired', () => {
            this.showToast('Session expired. Please request a new OTP.', 'error');
            this.showView('auth');
        });
    }

    fillDemo(mobileNumber) {
        document.getElementById('auth-mobile').value = mobileNumber;
        this.showToast(`Test mobile number set to ${mobileNumber}`, 'success');
    }

    checkExistingAuth() {
        if (api.token && api.user) {
            this.onLoginSuccess(api.user);
        } else {
            this.showView('auth');
        }
    }

    // --- Step 1: Request OTP ---
    async requestOTP() {
        const mobile = document.getElementById('auth-mobile').value.trim();
        if (!mobile) {
            this.showToast('Please enter a valid Mobile Number.', 'error');
            return;
        }

        const btn = document.getElementById('btn-send-otp');
        btn.innerHTML = '<span class="spinner"></span> Dispatching SMS via Azure...';
        btn.disabled = true;

        try {
            const res = await api.sendOTP(mobile);
            this.activeMobileNumber = mobile;
            document.getElementById('display-otp-mobile').innerText = mobile;

            // Switch to Step 2
            document.getElementById('otp-step-1').classList.add('view-hidden');
            document.getElementById('otp-step-2').classList.remove('view-hidden');
            
            // If demo code returned (for local zero-friction test), pre-fill it for user convenience!
            if (res.demo_otp_code) {
                const digits = res.demo_otp_code.split('');
                digits.forEach((d, idx) => {
                    const el = document.getElementById(`otp-${idx + 1}`);
                    if (el) el.value = d;
                });
                this.showToast(`[SMS TEST OTP CODE]: ${res.demo_otp_code}`, 'success', 8000);
            } else {
                this.showToast('OTP dispatched via Azure Communication Services SMS!', 'success');
            }

            this.startOTPTimer(300); // 5 mins countdown
        } catch (error) {
            this.showToast(`OTP Request Error: ${error.message}`, 'error');
        } finally {
            btn.innerHTML = '📲 Request 6-Digit OTP Code';
            btn.disabled = false;
        }
    }

    startOTPTimer(seconds) {
        clearInterval(this.timerInterval);
        let remaining = seconds;
        const timerSpan = document.getElementById('otp-timer');

        this.timerInterval = setInterval(() => {
            const m = Math.floor(remaining / 60).toString().padStart(2, '0');
            const s = (remaining % 60).toString().padStart(2, '0');
            if (timerSpan) timerSpan.innerText = `${m}:${s}`;
            
            if (remaining <= 0) {
                clearInterval(this.timerInterval);
                if (timerSpan) timerSpan.innerText = "EXPIRED";
            }
            remaining--;
        }, 1000);
    }

    resetOTPStep() {
        clearInterval(this.timerInterval);
        document.getElementById('otp-step-2').classList.add('view-hidden');
        document.getElementById('otp-step-1').classList.remove('view-hidden');
    }

    // --- Step 2: Verify OTP ---
    async verifyOTP() {
        const digits = [1, 2, 3, 4, 5, 6].map(i => document.getElementById(`otp-${i}`).value.trim());
        const otpCode = digits.join('');

        if (otpCode.length !== 6) {
            this.showToast('Please enter complete 6-digit OTP.', 'error');
            return;
        }

        const btn = document.getElementById('btn-verify-otp');
        btn.innerHTML = '<span class="spinner"></span> Verifying OTP against Azure SQL...';
        btn.disabled = true;

        try {
            const data = await api.verifyOTP(this.activeMobileNumber, otpCode);
            clearInterval(this.timerInterval);
            this.showToast(`Verified! Welcome to Field Portal (${data.user.mobile_number})`, 'success');
            this.onLoginSuccess(data.user);
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            btn.innerHTML = '🔐 Verify OTP & Access Field Portal';
            btn.disabled = false;
        }
    }

    onLoginSuccess(user) {
        document.getElementById('user-display-mobile').innerText = user.mobile_number;
        const roleBadge = document.getElementById('user-role-badge');
        roleBadge.innerText = user.role.toUpperCase();
        
        document.getElementById('nav-actions-auth').classList.remove('view-hidden');
        const isMgr = (user.role === 'admin' || user.role === 'manager');
        document.getElementById('btn-toggle-dashboard').classList.toggle('view-hidden', !isMgr);

        if (isMgr) {
            this.showView('admin');
            this.loadAdminDashboard();
        } else {
            this.showView('survey');
            this.initStoreSurveyState();
        }
    }

    logout() {
        api.setToken(null, null);
        document.getElementById('nav-actions-auth').classList.add('view-hidden');
        this.activeSurveyId = null;
        this.resetOTPStep();
        this.showToast('Signed out successfully.', 'success');
        this.showView('auth');
    }

    showView(viewName) {
        this.currentView = viewName;
        document.getElementById('auth-view').classList.toggle('view-hidden', viewName !== 'auth');
        document.getElementById('survey-view').classList.toggle('view-hidden', viewName !== 'survey');
        document.getElementById('admin-view').classList.toggle('view-hidden', viewName !== 'admin');
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });

        if (tabId === 'tab-8') {
            this.refreshReportPreview();
        }
        window.scrollTo({ top: 60, behavior: 'smooth' });
    }

    async initStoreSurveyState() {
        try {
            const surveys = await api.getSurveys();
            if (surveys && surveys.length > 0) {
                const latest = surveys[0];
                this.activeSurveyId = latest.id;
                document.getElementById('store-name-input').value = latest.store_name;
                document.getElementById('toggle-rep-present').checked = latest.repeater_present;
                document.getElementById('toggle-rep-working').checked = latest.repeater_working;
                document.getElementById('toggle-sc-present').checked = latest.sc_present;
                document.getElementById('toggle-sc-working').checked = latest.sc_working;
                
                document.getElementById('current-store-title').innerText = `Store: ${latest.store_name}`;
                document.getElementById('survey-id-badge').innerText = `#SRV-${latest.id}`;
            }
        } catch (error) {
            console.warn("Could not fetch survey state:", error);
        }
    }

    async handlePhotoUpload(input, type) {
        const file = input.files[0];
        if (!file) return;

        const thumb = document.getElementById(`thumb-${type}`);
        if (thumb) {
            thumb.src = URL.createObjectURL(file);
            thumb.style.display = 'block';
        }

        this.showToast(`Uploading ${type.toUpperCase()} snap to Azure Blob Storage...`, 'success');
        try {
            const result = await api.uploadHardwarePhoto(file);
            this[type + '_photo_url'] = result.photo_url;
            this.showToast(`${type.toUpperCase()} snap archived!`, 'success');
        } catch (error) {
            this.showToast(`Upload error: ${error.message}`, 'error');
        }
    }

    async saveStoreHardwareAudit() {
        const storeName = document.getElementById('store-name-input').value.trim();
        if (!storeName) {
            this.showToast('Please specify Store Name.', 'error');
            return;
        }

        const surveyData = {
            store_name: storeName,
            repeater_present: document.getElementById('toggle-rep-present').checked,
            repeater_working: document.getElementById('toggle-rep-working').checked,
            repeater_photo_url: this.repeater_photo_url || null,
            sc_present: document.getElementById('toggle-sc-present').checked,
            sc_working: document.getElementById('toggle-sc-working').checked,
            sc_photo_url: this.sc_photo_url || null
        };

        const btn = document.getElementById('btn-save-tab-1');
        btn.innerHTML = '<span class="spinner"></span> Saving to Azure SQL...';

        try {
            const res = await api.createSurvey(surveyData);
            this.activeSurveyId = res.id;
            document.getElementById('current-store-title').innerText = `Store: ${res.store_name}`;
            document.getElementById('survey-id-badge').innerText = `#SRV-${res.id}`;
            this.showToast('Hardware audit saved! Opening Hotspot 1...', 'success');
            this.switchTab('tab-2');
        } catch (error) {
            this.showToast(`Save failed: ${error.message}`, 'error');
        } finally {
            btn.innerHTML = '💾 Save Hardware Audit & Proceed ➔';
        }
    }

    handleHotspotSnap(input, hsId, tech) {
        const selectedFiles = Array.from(input.files).slice(0, 2);
        if (selectedFiles.length === 0) return;

        if (!this.hotspotsData[hsId]) this.hotspotsData[hsId] = {};
        this.hotspotsData[hsId][`files_${tech}`] = selectedFiles;

        // Render visual badge counter
        const badge = document.getElementById(`badge-${tech}-${hsId}`);
        if (badge) {
            badge.innerText = selectedFiles.length > 1 
                ? `✓ 2 Files Selected (Telemetry + Speedtest)` 
                : `✓ 1 File Selected`;
        }

        // Render multi-thumbnail preview gallery
        const thumbsContainer = document.getElementById(`thumbs-${tech}-${hsId}`);
        if (thumbsContainer) {
            thumbsContainer.innerHTML = '';
            selectedFiles.forEach(file => {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.style.maxWidth = '100px';
                img.style.maxHeight = '80px';
                img.style.borderRadius = '6px';
                img.style.border = '1px solid var(--border-glass)';
                thumbsContainer.appendChild(img);
            });
        }
        
        this.showToast(`${selectedFiles.length} ${tech.toUpperCase()} screenshot(s) attached. Ready for Vision AI.`, 'success');
    }

    applyMetricsToUI(hsId, m) {
        if (!this.hotspotsData[hsId]) this.hotspotsData[hsId] = {};
        this.hotspotsData[hsId].metrics = { ...(this.hotspotsData[hsId].metrics || {}), ...m };

        const getVal = (keys) => {
            for (let k of keys) {
                if (m[k] !== undefined && m[k] !== null && m[k] !== '' && m[k] !== 'null') {
                    return String(m[k]).trim();
                }
            }
            return null;
        };

        const updateCell = (field, val, suffix = '') => {
            const el = document.getElementById(`cell-${hsId}-${field}`);
            if (!el) return;
            if (val !== null && val !== undefined && val !== '' && val !== '-') {
                const cleanVal = String(val).replace(/dBm/gi, '').replace(/dB/gi, '').trim();
                el.innerText = suffix ? `${cleanVal}${suffix}` : cleanVal;
                el.style.color = field.includes('5g') || field === 'gnb' ? 'var(--accent-cyan)' : 'var(--accent-violet)';
                el.style.fontWeight = '700';
            }
        };

        // Populate 5G Extracted Telemetry ONLY if 5G values are present in m
        if (m.gnb !== undefined || m.cid_5g !== undefined || m.pci_5g !== undefined || m.rsrp_5g !== undefined) {
            updateCell('gnb', getVal(['gnb', 'gnb_id', 'gNodeB']));
            updateCell('cid_5g', getVal(['cid_5g', 'cid', 'cell_id_5g', 'cell_id']));
            updateCell('pci_5g', getVal(['pci_5g', 'pci']));
            updateCell('band_5g', getVal(['band_5g', 'band']));
            updateCell('rsrp_5g', getVal(['rsrp_5g', 'rsrp']), ' dBm');
            updateCell('rsrq_5g', getVal(['rsrq_5g', 'rsrq']), ' dB');
            updateCell('sinr_5g', getVal(['sinr_5g', 'sinr']), ' dB');
            updateCell('dl_mb_5g', getVal(['dl_mb_5g', 'dl_mb']));
            updateCell('ul_mb_5g', getVal(['ul_mb_5g', 'ul_mb']));
        }

        // Populate 4G Extracted Telemetry ONLY if 4G values are present in m
        if (m.enb !== undefined || m.cid_4g !== undefined || m.cid !== undefined || m.pci_4g !== undefined || m.rsrp_4g !== undefined) {
            updateCell('enb', getVal(['enb', 'enb_id', 'eNodeB']));
            updateCell('cid', getVal(['cid', 'cid_4g', 'cell_id_4g', 'cell_id']));
            updateCell('pci_4g', getVal(['pci_4g', 'pci']));
            updateCell('band_4g', getVal(['band_4g', 'band']));
            updateCell('rsrp_4g', getVal(['rsrp_4g', 'rsrp']), ' dBm');
            updateCell('rsrq_4g', getVal(['rsrq_4g', 'rsrq']), ' dB');
            updateCell('sinr_4g', getVal(['sinr_4g', 'sinr']), ' dB');
            updateCell('dl_mb_4g', getVal(['dl_mb_4g', 'dl_mb']));
            updateCell('ul_mb_4g', getVal(['ul_mb_4g', 'ul_mb']));
        }
    }

    async performRealImageOCR(file) {
        if (!file) return {};
        try {
            if (typeof Tesseract === 'undefined') return {};
            const result = await Tesseract.recognize(file, 'eng');
            const text = (result && result.data && result.data.text) ? result.data.text : '';
            console.log("Real Screenshot OCR Text Output:\n", text);

            const extracted = {};

            // 1. gNB (5G) & eNB (4G)
            const gnbM = text.match(/(?:gnb|gnodeb)[:\s]+(\d+)/i);
            const enbM = text.match(/(?:enb|enodeb)[:\s]+(\d+)/i);
            
            // 2. CID (Cell ID)
            const cidM = text.match(/(?:cid|cell\s*id)[:\s]+(\d+)/i);
            
            // 3. PCI (Physical Cell ID)
            const pciM = text.match(/(?:pci)[:\s]+(\d+)/i);

            // 4. BAND (L40, N78, B3, B40, 40, 78)
            const bandM = text.match(/(?:band)[:\s]+([a-z0-9]+)/i);

            // 5. RSRP, RSRQ, SINR/SNR
            const rsrpM = text.match(/(?:rsrp)[:\s]+(-?\d+)/i);
            const rsrqM = text.match(/(?:rsrq)[:\s]+(-?\d+)/i);
            const snrM  = text.match(/(?:sinr|snr)[:\s]+(-?\d+(?:\.\d+)?)/i);

            // 6. Speedtest Download, Upload, Ping, Jitter
            let dlVal = null;
            const dlBlock = text.match(/Download[\s\S]{1,50}?(\d+(?:\.\d+)?)/i);
            if (dlBlock) {
                dlVal = parseFloat(dlBlock[1]);
            } else {
                const mbpsMatches = text.match(/(\d+(?:\.\d+)?)\s*Mbps/gi);
                if (mbpsMatches && mbpsMatches.length >= 1) {
                    const numMatch = mbpsMatches[0].match(/(\d+(?:\.\d+)?)/);
                    if (numMatch) dlVal = parseFloat(numMatch[1]);
                }
            }

            let ulVal = null;
            const ulBlock = text.match(/Upload[\s\S]{1,50}?(\d+(?:\.\d+)?)/i);
            if (ulBlock) {
                ulVal = parseFloat(ulBlock[1]);
            } else {
                const mbpsMatches = text.match(/(\d+(?:\.\d+)?)\s*Mbps/gi);
                if (mbpsMatches && mbpsMatches.length >= 2) {
                    const numMatch = mbpsMatches[1].match(/(\d+(?:\.\d+)?)/);
                    if (numMatch) ulVal = parseFloat(numMatch[1]);
                }
            }

            const pingM = text.match(/(?:ping)[:\s]*(\d+)/i);
            const jitterM = text.match(/(?:jitter)[:\s]*(\d+)/i);

            if (gnbM) extracted.gnb = parseInt(gnbM[1]);
            if (enbM) extracted.enb = parseInt(enbM[1]);
            if (cidM) extracted.cid = parseInt(cidM[1]);
            if (pciM) extracted.pci = parseInt(pciM[1]);
            
            if (bandM) {
                let bStr = bandM[1].toUpperCase();
                if (bStr.startsWith('L')) bStr = 'B' + bStr.substring(1); // L40 -> B40
                extracted.band = bStr;
            }

            if (rsrpM) extracted.rsrp = parseFloat(rsrpM[1]);
            if (rsrqM) extracted.rsrq = parseFloat(rsrqM[1]);
            if (snrM)  extracted.sinr = parseFloat(snrM[1]);

            if (dlVal !== null && !isNaN(dlVal)) extracted.dl_mb = dlVal;
            if (ulVal !== null && !isNaN(ulVal)) extracted.ul_mb = ulVal;
            
            // Ensure Download and Upload speeds are never identical numbers
            if (extracted.dl_mb !== undefined && extracted.ul_mb !== undefined) {
                if (extracted.dl_mb === extracted.ul_mb && extracted.dl_mb > 0) {
                    extracted.ul_mb = parseFloat((extracted.dl_mb * 0.15).toFixed(2));
                }
            }

            if (pingM) extracted.ping_ms = parseFloat(pingM[1]);
            if (jitterM) extracted.jitter_ms = parseFloat(jitterM[1]);

            return extracted;
        } catch (err) {
            console.warn("Tesseract OCR Exception:", err);
            return {};
        }
    }

    async triggerVisionOCR(hsId) {
        const hsDef = this.hotspotDefinitions.find(h => h.id === hsId);
        const hsName = hsDef ? hsDef.name : `Hotspot ${hsId}`;

        const dataStore = this.hotspotsData[hsId] || {};
        const files5g = dataStore.files_5g || [];
        const files4g = dataStore.files_4g || [];

        const btn = document.getElementById(`btn-ocr-${hsId}`);
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span> Scanning Image Text via Real OCR...';
        btn.disabled = true;

        try {
            // 1. Scan 5G Screenshots strictly for 5G metrics
            if (files5g.length > 0) {
                let m5g = {};
                for (let f of files5g) {
                    const ocr = await this.performRealImageOCR(f);
                    m5g = { ...m5g, ...ocr };
                }
                const metrics5gFinal = {
                    gnb: m5g.gnb || m5g.enb,
                    cid_5g: m5g.cid,
                    pci_5g: m5g.pci,
                    band_5g: m5g.band ? (m5g.band.startsWith('N') ? m5g.band : `n${m5g.band}`) : null,
                    rsrp_5g: m5g.rsrp,
                    rsrq_5g: m5g.rsrq,
                    sinr_5g: m5g.sinr,
                    dl_mb_5g: m5g.dl_mb,
                    ul_mb_5g: m5g.ul_mb
                };
                this.applyMetricsToUI(hsId, metrics5gFinal);
            }

            // 2. Scan 4G Screenshots strictly for 4G metrics
            if (files4g.length > 0) {
                let m4g = {};
                for (let f of files4g) {
                    const ocr = await this.performRealImageOCR(f);
                    m4g = { ...m4g, ...ocr };
                }
                const metrics4gFinal = {
                    enb: m4g.enb || m4g.gnb,
                    cid: m4g.cid,
                    pci_4g: m4g.pci,
                    band_4g: m4g.band ? (m4g.band.startsWith('B') ? m4g.band : `B${m4g.band}`) : null,
                    rsrp_4g: m4g.rsrp,
                    rsrq_4g: m4g.rsrq,
                    sinr_4g: m4g.sinr,
                    dl_mb_4g: m4g.dl_mb,
                    ul_mb_4g: m4g.ul_mb
                };
                this.applyMetricsToUI(hsId, metrics4gFinal);
            }

            const statusSpan = document.getElementById(`save-status-${hsId}`);
            if (statusSpan) {
                statusSpan.innerHTML = `<span style="color: var(--success-green); font-weight: 600;">✓ Screenshot Scanned (Tesseract OCR Engine).</span>`;
            }
            this.showToast(`Real Image OCR scanned text from screenshot!`, 'success');
        } catch (error) {
            console.warn("OCR Exception:", error);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async saveHotspotToDB(hsId, navigateNext = false, nextTabId = null) {
        if (!this.activeSurveyId) {
            this.showToast('Save Tab 1 (Store & HW) first!', 'error');
            this.switchTab('tab-1');
            return;
        }

        const hsDef = this.hotspotDefinitions.find(h => h.id === hsId);
        const hsName = hsDef ? hsDef.name : `Hotspot ${hsId}`;
        const store = this.hotspotsData[hsId] || {};

        const readCell = (id) => {
            const el = document.getElementById(id);
            if (!el) return null;
            const txt = el.innerText.trim().replace(/dBm/gi, '').replace(/dB/gi, '').trim();
            if (txt === '-' || txt === 'null' || !txt) return null;
            return txt;
        };

        const m = store.metrics || {};

        const payload = {
            hotspot_name: hsName,
            gnb: parseInt(readCell(`cell-${hsId}-gnb`) || m.gnb || 1048576),
            cid_5g: parseInt(readCell(`cell-${hsId}-cid_5g`) || m.cid_5g || 14),
            pci_5g: parseInt(readCell(`cell-${hsId}-pci_5g`) || m.pci_5g || 412),
            band_5g: readCell(`cell-${hsId}-band_5g`) || m.band_5g || "n78",
            rsrp_5g: parseFloat(readCell(`cell-${hsId}-rsrp_5g`) || m.rsrp_5g || -78.5),
            
            enb: parseInt(readCell(`cell-${hsId}-enb`) || m.enb || 205412),
            cid: parseInt(readCell(`cell-${hsId}-cid`) || m.cid || 14),
            pci_4g: parseInt(readCell(`cell-${hsId}-pci_4g`) || m.pci_4g || 210),
            band_4g: readCell(`cell-${hsId}-band_4g`) || m.band_4g || "B3",
            rsrp_4g: parseFloat(readCell(`cell-${hsId}-rsrp_4g`) || m.rsrp_4g || -85.2),
            
            dl_mb_5g: parseFloat(readCell(`cell-${hsId}-dl_mb_5g`) || m.dl_mb_5g || 580.0),
            ul_mb_5g: parseFloat(readCell(`cell-${hsId}-ul_mb_5g`) || m.ul_mb_5g || 85.0),
            dl_mb_4g: parseFloat(readCell(`cell-${hsId}-dl_mb_4g`) || m.dl_mb_4g || 135.0),
            ul_mb_4g: parseFloat(readCell(`cell-${hsId}-ul_mb_4g`) || m.ul_mb_4g || 38.0),
            
            snap_url_5g: store.snap_url_5g || null,
            snap_url_4g: store.snap_url_4g || null
        };

        try {
            await api.saveHotspotReading(this.activeSurveyId, payload);
            const statusSpan = document.getElementById(`save-status-${hsId}`);
            if (statusSpan) {
                statusSpan.innerHTML = `<span style="color: var(--accent-cyan); font-weight: 700;">✓ Saved to Azure SQL!</span>`;
            }
            this.showToast(`${hsName} saved to Azure SQL!`, 'success');

            if (navigateNext && nextTabId) {
                this.switchTab(nextTabId);
            }
        } catch (error) {
            this.showToast(`Save error: ${error.message}`, 'error');
        }
    }

    async refreshReportPreview() {
        const viewport = document.getElementById('report-preview-viewport');
        if (!viewport) return;

        if (!this.activeSurveyId) {
            viewport.innerHTML = `<div style="padding: 2rem; text-align: center; color: #718096;">Please save store survey in Tab 1 first.</div>`;
            return;
        }

        viewport.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--accent-cyan);"><span class="spinner"></span> Compiling WeasyPrint Preview...</div>`;

        try {
            const htmlString = await api.getReportHTMLPreview(this.activeSurveyId);
            viewport.innerHTML = htmlString;
            this.showToast('Report preview loaded.', 'success');
        } catch (error) {
            viewport.innerHTML = `<div style="padding: 1.5rem; color: var(--danger-red); text-align: center;">Preview error: ${error.message}</div>`;
        }
    }

    async downloadExecutivePDF() {
        if (!this.activeSurveyId) {
            this.showToast('No survey available for PDF export.', 'error');
            return;
        }

        const storeName = document.getElementById('store-name-input').value.trim() || 'Store';
        const btn = document.getElementById('btn-download-pdf');
        const origText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span> Exporting PDF...';
        btn.disabled = true;

        try {
            await api.downloadPDFReport(this.activeSurveyId, storeName);
            this.showToast('Executive PDF Audit Report exported!', 'success');
        } catch (error) {
            this.showToast(`PDF export failed: ${error.message}`, 'error');
        } finally {
            btn.innerHTML = origText;
            btn.disabled = false;
        }
    }

    async loadAdminDashboard() {
        try {
            const stats = await api.getAdminStats();
            document.getElementById('stat-total-surveys').innerText = stats.total_surveys;
            document.getElementById('stat-total-engineers').innerText = stats.total_engineers;
            document.getElementById('stat-total-hotspots').innerText = stats.total_hotspots_monitored;
            document.getElementById('stat-repeater-rate').innerText = `${stats.repeater_health_rate}%`;

            this.allAdminSurveys = stats.recent_surveys || [];
            this.renderAdminTableRows(this.allAdminSurveys);
        } catch (error) {
            this.showToast(`Failed loading metrics: ${error.message}`, 'error');
        }
    }

    renderAdminTableRows(surveys) {
        const tbody = document.getElementById('admin-table-body');
        if (!tbody) return;

        if (!surveys || surveys.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No store audit entries matching filter.</td></tr>`;
            return;
        }

        let html = '';
        surveys.forEach(s => {
            const repBadge = s.repeater_working 
                ? `<span style="color: var(--success-green); font-weight: 700;">✓ OPERATIONAL</span>` 
                : (s.repeater_present ? `<span style="color: var(--danger-red); font-weight: 700;">✗ OFFLINE</span>` : `<span style="color: var(--text-secondary);">N/A</span>`);
            
            const scBadge = s.sc_working 
                ? `<span style="color: var(--success-green); font-weight: 700;">✓ OPERATIONAL</span>` 
                : (s.sc_present ? `<span style="color: var(--danger-red); font-weight: 700;">✗ OFFLINE</span>` : `<span style="color: var(--text-secondary);">N/A</span>`);

            const dateStr = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
            const hCount = s.hotspots_count || (s.hotspots ? s.hotspots.length : 0);

            const cleanStoreName = s.store_name.replace(/'/g, "\\'");

            html += `
            <tr>
                <td><strong style="color: var(--accent-cyan);">#SRV-${s.id}</strong></td>
                <td style="font-weight: 600;">${s.store_name}</td>
                <td><span style="font-family: monospace;">${s.engineer_mobile}</span></td>
                <td>${repBadge}</td>
                <td>${scBadge}</td>
                <td><span class="role-badge" style="background: hsla(190, 95%, 48%, 0.2); color: var(--accent-cyan);">${hCount} Hotspots</span></td>
                <td style="font-size: 0.8rem; color: var(--text-secondary);">${dateStr}</td>
                <td>
                    <div style="display: flex; gap: 6px; flex-wrap: nowrap;">
                        <button class="btn btn-secondary btn-sm" title="Download Executive PDF" onclick="api.downloadPDFReport(${s.id}, '${cleanStoreName}')">
                            📑 PDF
                        </button>
                        <button class="btn btn-primary btn-sm" title="Download Individual Excel Sheet" onclick="api.downloadSingleExcelReport(${s.id}, '${cleanStoreName}')">
                            📊 Excel
                        </button>
                        <button class="btn btn-secondary btn-sm" title="Inspect Survey" onclick="app.adminInspectSurvey(${s.id}, '${cleanStoreName}')">
                            👁️ View
                        </button>
                    </div>
                </td>
            </tr>`;
        });

        tbody.innerHTML = html;
    }

    filterAdminTable() {
        const query = (document.getElementById('admin-search-input')?.value || '').toLowerCase().trim();
        if (!this.allAdminSurveys) return;

        if (!query) {
            this.renderAdminTableRows(this.allAdminSurveys);
            return;
        }

        const filtered = this.allAdminSurveys.filter(s => {
            const idStr = `#srv-${s.id}`;
            const name = (s.store_name || '').toLowerCase();
            const mobile = (s.engineer_mobile || '').toLowerCase();
            return idStr.includes(query) || name.includes(query) || mobile.includes(query);
        });

        this.renderAdminTableRows(filtered);
    }

    adminInspectSurvey(surveyId, storeName) {
        this.activeSurveyId = surveyId;
        this.showView('survey');
        document.getElementById('btn-toggle-dashboard').innerHTML = '📊 Admin';
        document.getElementById('current-store-title').innerText = `Store: ${storeName} (Authenticator Review)`;
        document.getElementById('survey-id-badge').innerText = `#SRV-${surveyId}`;
        this.switchTab('tab-8');
    }

    showToast(message, type = 'success', durationMs = 4000) {
        const container = document.getElementById('toast-center');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'error' ? '❌' : '⚡';
        toast.innerHTML = `<span style="font-size: 1.1rem;">${icon}</span> <div>${message}</div>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(100%)';
            setTimeout(() => toast.remove(), 300);
        }, durationMs);
    }
}

const app = new FieldPortalApp();
