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
                    <!-- 5G Telemetry Dropzone -->
                    <div class="dropzone-box" id="drop-5g_telemetry-${hs.id}" onclick="document.getElementById('file-5g_telemetry-${hs.id}').click();">
                        <div class="dropzone-icon">📱</div>
                        <div style="font-weight: 700; font-size: 0.9rem; color: var(--accent-cyan);">5G Telemetry Screenshot</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">G-NetTrack RF Metrics</div>
                        <div id="badge-5g_telemetry-${hs.id}" style="font-size: 0.8rem; font-weight: 700; color: var(--accent-cyan); margin-top: 4px;"></div>
                        <div id="thumbs-5g_telemetry-${hs.id}" style="display: flex; gap: 4px; justify-content: center; margin-top: 4px; flex-wrap: wrap;"></div>
                        <input type="file" id="file-5g_telemetry-${hs.id}" accept="image/*" style="display: none;" onchange="app.handleHotspotSnap(this, ${hs.id}, '5g_telemetry')">
                    </div>

                    <!-- 5G Speedtest Dropzone -->
                    <div class="dropzone-box" id="drop-5g_speedtest-${hs.id}" onclick="document.getElementById('file-5g_speedtest-${hs.id}').click();" style="border-color: hsla(190, 95%, 48%, 0.4);">
                        <div class="dropzone-icon" style="color: var(--accent-cyan);">⚡</div>
                        <div style="font-weight: 700; font-size: 0.9rem; color: var(--accent-cyan);">5G Speedtest Screenshot</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">DL & UL Speed Test</div>
                        <div id="badge-5g_speedtest-${hs.id}" style="font-size: 0.8rem; font-weight: 700; color: var(--accent-cyan); margin-top: 4px;"></div>
                        <div id="thumbs-5g_speedtest-${hs.id}" style="display: flex; gap: 4px; justify-content: center; margin-top: 4px; flex-wrap: wrap;"></div>
                        <input type="file" id="file-5g_speedtest-${hs.id}" accept="image/*" style="display: none;" onchange="app.handleHotspotSnap(this, ${hs.id}, '5g_speedtest')">
                    </div>

                    <!-- 4G Telemetry Dropzone -->
                    <div class="dropzone-box" id="drop-4g_telemetry-${hs.id}" onclick="document.getElementById('file-4g_telemetry-${hs.id}').click();" style="border-color: hsla(265, 89%, 66%, 0.4);">
                        <div class="dropzone-icon" style="color: var(--accent-violet);">📶</div>
                        <div style="font-weight: 700; font-size: 0.9rem; color: var(--accent-violet);">4G Telemetry Screenshot</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">G-NetTrack RF Metrics</div>
                        <div id="badge-4g_telemetry-${hs.id}" style="font-size: 0.8rem; font-weight: 700; color: var(--accent-violet); margin-top: 4px;"></div>
                        <div id="thumbs-4g_telemetry-${hs.id}" style="display: flex; gap: 4px; justify-content: center; margin-top: 4px; flex-wrap: wrap;"></div>
                        <input type="file" id="file-4g_telemetry-${hs.id}" accept="image/*" style="display: none;" onchange="app.handleHotspotSnap(this, ${hs.id}, '4g_telemetry')">
                    </div>

                    <!-- 4G Speedtest Dropzone -->
                    <div class="dropzone-box" id="drop-4g_speedtest-${hs.id}" onclick="document.getElementById('file-4g_speedtest-${hs.id}').click();" style="border-color: hsla(265, 89%, 66%, 0.4);">
                        <div class="dropzone-icon" style="color: var(--accent-violet);">🚀</div>
                        <div style="font-weight: 700; font-size: 0.9rem; color: var(--accent-violet);">4G Speedtest Screenshot</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">DL & UL Speed Test</div>
                        <div id="badge-4g_speedtest-${hs.id}" style="font-size: 0.8rem; font-weight: 700; color: var(--accent-violet); margin-top: 4px;"></div>
                        <div id="thumbs-4g_speedtest-${hs.id}" style="display: flex; gap: 4px; justify-content: center; margin-top: 4px; flex-wrap: wrap;"></div>
                        <input type="file" id="file-4g_speedtest-${hs.id}" accept="image/*" style="display: none;" onchange="app.handleHotspotSnap(this, ${hs.id}, '4g_speedtest')">
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
                                    <td style="font-size: 0.85rem; color: var(--text-secondary);"><strong>Download Speed (DL):</strong> <span id="cell-${hs.id}-dl_mb_5g" contenteditable="true" style="color: var(--accent-cyan); font-weight: 700;">-</span> Mbps</td>
                                    <td style="font-size: 0.85rem; color: var(--text-secondary);"><strong>Download Speed (DL):</strong> <span id="cell-${hs.id}-dl_mb_4g" contenteditable="true" style="color: var(--accent-violet); font-weight: 700;">-</span> Mbps</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 0.85rem; color: var(--text-secondary);"><strong>Upload Speed (UL):</strong> <span id="cell-${hs.id}-ul_mb_5g" contenteditable="true" style="color: var(--accent-cyan); font-weight: 700;">-</span> Mbps</td>
                                    <td style="font-size: 0.85rem; color: var(--text-secondary);"><strong>Upload Speed (UL):</strong> <span id="cell-${hs.id}-ul_mb_4g" contenteditable="true" style="color: var(--accent-violet); font-weight: 700;">-</span> Mbps</td>
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

    handleHotspotSnap(input, hsId, techKey) {
        const selectedFiles = Array.from(input.files).slice(0, 2);
        if (selectedFiles.length === 0) return;

        if (!this.hotspotsData[hsId]) this.hotspotsData[hsId] = {};
        this.hotspotsData[hsId][`files_${techKey}`] = selectedFiles;

        const ds = this.hotspotsData[hsId];
        ds.files_5g = [
            ...(ds.files_5g_telemetry || []),
            ...(ds.files_5g_speedtest || []),
            ...(ds.files_5g || [])
        ].filter((f, idx, self) => self.indexOf(f) === idx);

        ds.files_4g = [
            ...(ds.files_4g_telemetry || []),
            ...(ds.files_4g_speedtest || []),
            ...(ds.files_4g || [])
        ].filter((f, idx, self) => self.indexOf(f) === idx);

        // Render visual badge counter
        const badge = document.getElementById(`badge-${techKey}-${hsId}`);
        if (badge) {
            badge.innerText = `✓ ${selectedFiles.length} File Attached`;
        }

        // Render multi-thumbnail preview gallery
        const thumbsContainer = document.getElementById(`thumbs-${techKey}-${hsId}`);
        if (thumbsContainer) {
            thumbsContainer.innerHTML = '';
            selectedFiles.forEach(file => {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.style.maxWidth = '90px';
                img.style.maxHeight = '70px';
                img.style.borderRadius = '6px';
                img.style.border = '1px solid var(--border-glass)';
                thumbsContainer.appendChild(img);
            });
        }
        
        this.showToast(`${techKey.replace('_', ' ').toUpperCase()} screenshot attached. Ready for Vision AI.`, 'success');
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

        // Populate 5G Extracted Telemetry & Speedtest speeds
        const has5gData = m.gnb !== undefined || m.cid_5g !== undefined || m.pci_5g !== undefined || 
                          m.rsrp_5g !== undefined || m.dl_mb_5g !== undefined || m.ul_mb_5g !== undefined || 
                          m.dl_mb !== undefined || m.ul_mb !== undefined;
        if (has5gData) {
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

        // Populate 4G Extracted Telemetry & Speedtest speeds
        const has4gData = m.enb !== undefined || m.cid_4g !== undefined || m.cid !== undefined || 
                          m.pci_4g !== undefined || m.rsrp_4g !== undefined || m.dl_mb_4g !== undefined || 
                          m.ul_mb_4g !== undefined || m.dl_mb !== undefined || m.ul_mb !== undefined;
        if (has4gData) {
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

    async cropRegionOfImage(file, xRatio, yRatio, wRatio, hRatio) {
        return new Promise((resolve) => {
            try {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const startX = Math.floor(img.width * xRatio);
                        const startY = Math.floor(img.height * yRatio);
                        const cropW = Math.floor(img.width * wRatio);
                        const cropH = Math.floor(img.height * hRatio);

                        canvas.width = Math.max(cropW, 10);
                        canvas.height = Math.max(cropH, 10);
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, startX, startY, cropW, cropH, 0, 0, cropW, cropH);
                        canvas.toBlob((blob) => {
                            resolve(blob || file);
                        }, 'image/jpeg');
                    } catch (e) {
                        resolve(file);
                    }
                };
                img.onerror = () => resolve(file);
                img.src = URL.createObjectURL(file);
            } catch (e) {
                resolve(file);
            }
        });
    }

    async performRealImageOCR(file, mode = 'auto') {
        if (!file) return {};
        try {
            if (typeof Tesseract === 'undefined') return {};

            const extracted = {};

            // ===== SPEEDTEST MODE: Crop-based extraction (most reliable) =====
            if (mode === 'speedtest') {
                console.log('[OCR Speedtest] Starting crop-based speed extraction...');
                let dlVal = null;
                let ulVal = null;

                // Ookla Speedtest Layout (consistent across all screenshots):
                // - Download number box: x=3%, y=8%, width=46%, height=14%
                // - Upload number box:   x=51%, y=8%, width=46%, height=14%
                // These crop regions isolate ONLY the large speed numbers,
                // completely excluding Ping/Jitter/Ads below.

                // Crop and OCR the Download box
                try {
                    const dlCrop = await this.cropRegionOfImage(file, 0.03, 0.08, 0.46, 0.14);
                    const dlResult = await Tesseract.recognize(dlCrop, 'eng');
                    const dlText = (dlResult && dlResult.data && dlResult.data.text) ? dlResult.data.text : '';
                    console.log('[OCR Speedtest] Download crop text:', JSON.stringify(dlText));

                    // Extract the largest/first number from the crop (this IS the download speed)
                    const dlNums = dlText.match(/(\d{1,4}(?:\.\d{1,2})?)/g);
                    if (dlNums) {
                        // Pick the number that looks most like a speed value (>= 1.0)
                        for (const ns of dlNums) {
                            const v = parseFloat(ns);
                            if (!isNaN(v) && v >= 1.0 && v < 5000) { dlVal = v; break; }
                        }
                    }
                } catch (e) { console.warn('[OCR Speedtest] Download crop failed:', e); }

                // Crop and OCR the Upload box
                try {
                    const ulCrop = await this.cropRegionOfImage(file, 0.51, 0.08, 0.46, 0.14);
                    const ulResult = await Tesseract.recognize(ulCrop, 'eng');
                    const ulText = (ulResult && ulResult.data && ulResult.data.text) ? ulResult.data.text : '';
                    console.log('[OCR Speedtest] Upload crop text:', JSON.stringify(ulText));

                    const ulNums = ulText.match(/(\d{1,4}(?:\.\d{1,2})?)/g);
                    if (ulNums) {
                        for (const ns of ulNums) {
                            const v = parseFloat(ns);
                            if (!isNaN(v) && v >= 0.1 && v < 2000) { ulVal = v; break; }
                        }
                    }
                } catch (e) { console.warn('[OCR Speedtest] Upload crop failed:', e); }

                // Fallback: wider crop with both boxes together (y=7% to y=22%)
                if (dlVal === null || ulVal === null) {
                    try {
                        const wideCrop = await this.cropRegionOfImage(file, 0.02, 0.07, 0.96, 0.15);
                        const wideResult = await Tesseract.recognize(wideCrop, 'eng');
                        const wideText = (wideResult && wideResult.data && wideResult.data.text) ? wideResult.data.text : '';
                        console.log('[OCR Speedtest] Wide crop text:', JSON.stringify(wideText));

                        // Remove "Download", "Upload", "Mbps" labels, keep only numbers
                        const numbersOnly = wideText.replace(/download|upload|mbps|[a-z]/gi, ' ');
                        const allNums = numbersOnly.match(/(\d{1,4}(?:\.\d{1,2})?)/g);
                        if (allNums) {
                            const speeds = allNums.map(n => parseFloat(n)).filter(v => !isNaN(v) && v >= 0.1 && v < 5000);
                            if (dlVal === null && speeds.length >= 1) dlVal = speeds[0];
                            if (ulVal === null && speeds.length >= 2) ulVal = speeds[1];
                        }
                    } catch (e) { console.warn('[OCR Speedtest] Wide crop failed:', e); }
                }

                console.log(`[OCR Speedtest] Final result: DL=${dlVal}, UL=${ulVal}`);
                if (dlVal !== null) extracted.dl_mb = dlVal;
                if (ulVal !== null) extracted.ul_mb = ulVal;

                return extracted;
            }

            // ===== TELEMETRY / AUTO MODE: Full image text scan =====
            const resultFull = await Tesseract.recognize(file, 'eng');
            const textFull = (resultFull && resultFull.data && resultFull.data.text) ? resultFull.data.text : '';
            console.log(`[OCR] Raw text [mode=${mode}]:`, textFull.substring(0, 300));

            const isGNetTrack = /gnettrack|g-nettrack|mcc|mnc|tac|gnodeb|enodeb|serving|cellid|rsrp|rsrq|sinr|snr/i.test(textFull);

            // G-NetTrack: Extract Cell Telemetry ONLY
            if (isGNetTrack || mode === 'telemetry') {
                const gnbM = textFull.match(/(?:gnb|gnodeb)[:\s]+(\d+)/i);
                const enbM = textFull.match(/(?:enb|enodeb)[:\s]+(\d+)/i);
                const cidM = textFull.match(/(?:cid|cell\s*id)[:\s]+(\d+)/i);
                const pciM = textFull.match(/(?:pci)[:\s]+(\d+)/i);
                const bandM = textFull.match(/(?:band)[:\s]+([a-z0-9]+)/i);
                const rsrpM = textFull.match(/(?:rsrp)[:\s]+(-?\d+)/i);
                const rsrqM = textFull.match(/(?:rsrq)[:\s]+(-?\d+)/i);
                const snrM  = textFull.match(/(?:sinr|snr)[:\s]+(-?\d+(?:\.\d+)?)/i);

                if (gnbM) extracted.gnb = parseInt(gnbM[1]);
                if (enbM) extracted.enb = parseInt(enbM[1]);
                if (cidM) extracted.cid = parseInt(cidM[1]);
                if (pciM) extracted.pci = parseInt(pciM[1]);
                if (bandM) {
                    let bStr = bandM[1].toUpperCase();
                    if (bStr.startsWith('L')) bStr = 'B' + bStr.substring(1);
                    extracted.band = bStr;
                }
                if (rsrpM) extracted.rsrp = parseFloat(rsrpM[1]);
                if (rsrqM) extracted.rsrq = parseFloat(rsrqM[1]);
                if (snrM)  extracted.sinr = parseFloat(snrM[1]);
            }

            // AUTO mode: If it looks like a Speedtest, use crop-based extraction
            if (mode === 'auto' && !isGNetTrack && /speedtest|download|upload|mbps/i.test(textFull)) {
                const speedResult = await this.performRealImageOCR(file, 'speedtest');
                if (speedResult.dl_mb !== undefined) extracted.dl_mb = speedResult.dl_mb;
                if (speedResult.ul_mb !== undefined) extracted.ul_mb = speedResult.ul_mb;
            }

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
        const files5gTel = dataStore.files_5g_telemetry || [];
        const files5gSpd = dataStore.files_5g_speedtest || [];
        const files4gTel = dataStore.files_4g_telemetry || [];
        const files4gSpd = dataStore.files_4g_speedtest || [];

        const files5g = [...files5gTel, ...files5gSpd, ...(dataStore.files_5g || [])];
        const files4g = [...files4gTel, ...files4gSpd, ...(dataStore.files_4g || [])];

        const btn = document.getElementById(`btn-ocr-${hsId}`);
        const originalText = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<span class="spinner"></span> Scanning via Vision AI...';
            btn.disabled = true;
        }

        try {
            // 1. Check if user attached any files to THIS specific hotspot
            if (files5g.length === 0 && files4g.length === 0) {
                this.showToast(`⚠️ Please attach at least 1 screenshot for ${hsName} first.`, 'warning');
                const statusSpan = document.getElementById(`save-status-${hsId}`);
                if (statusSpan) {
                    statusSpan.innerHTML = `<span style="color: var(--text-secondary);">No screenshots attached for ${hsName}. Fields remain blank.</span>`;
                }
                return;
            }

            // 2. Invoke Backend Vision AI API endpoint (only use if real AI provider returned)
            if (files5g.length > 0 || files4g.length > 0) {
                try {
                    const apiResult = await api.extractHotspotData(hsName, files5g, files4g);
                    if (apiResult && apiResult.success && apiResult.metrics && apiResult.provider && !apiResult.provider.includes('Mock') && !apiResult.provider.includes('Fallback')) {
                        this.applyMetricsToUI(hsId, apiResult.metrics);
                        if (apiResult.snap_url_5g) dataStore.snap_url_5g = apiResult.snap_url_5g;
                        if (apiResult.snap_url_4g) dataStore.snap_url_4g = apiResult.snap_url_4g;
                    }
                } catch (apiErr) {
                    console.warn("Backend Vision AI API endpoint unreachable:", apiErr);
                }
            }

            // 3. OCR on 5G Telemetry Screenshot
            for (let f of files5gTel) {
                const ocr = await this.performRealImageOCR(f, 'telemetry');
                this.applyMetricsToUI(hsId, {
                    gnb: ocr.gnb, cid_5g: ocr.cid, pci_5g: ocr.pci,
                    band_5g: ocr.band ? (ocr.band.startsWith('N') ? ocr.band : `n${ocr.band}`) : null,
                    rsrp_5g: ocr.rsrp, rsrq_5g: ocr.rsrq, sinr_5g: ocr.sinr
                });
            }

            // 4. OCR on 5G Speedtest Screenshot (Dedicated Speedtest Scanner)
            for (let f of files5gSpd) {
                const ocr = await this.performRealImageOCR(f, 'speedtest');
                if (ocr.dl_mb !== undefined || ocr.ul_mb !== undefined) {
                    this.applyMetricsToUI(hsId, { dl_mb_5g: ocr.dl_mb, ul_mb_5g: ocr.ul_mb });
                }
            }

            // 5. OCR on 4G Telemetry Screenshot
            for (let f of files4gTel) {
                const ocr = await this.performRealImageOCR(f, 'telemetry');
                this.applyMetricsToUI(hsId, {
                    enb: ocr.enb, cid: ocr.cid, pci_4g: ocr.pci,
                    band_4g: ocr.band ? (ocr.band.startsWith('B') ? ocr.band : `B${ocr.band}`) : null,
                    rsrp_4g: ocr.rsrp, rsrq_4g: ocr.rsrq, sinr_4g: ocr.sinr
                });
            }

            // 6. OCR on 4G Speedtest Screenshot (Dedicated Speedtest Scanner)
            for (let f of files4gSpd) {
                const ocr = await this.performRealImageOCR(f, 'speedtest');
                if (ocr.dl_mb !== undefined || ocr.ul_mb !== undefined) {
                    this.applyMetricsToUI(hsId, { dl_mb_4g: ocr.dl_mb, ul_mb_4g: ocr.ul_mb });
                }
            }

            // Fallback for generic dropzones if used
            if (files5gSpd.length === 0 && files5g.length > 0) {
                for (let f of files5g) {
                    const ocr = await this.performRealImageOCR(f, 'auto');
                    if (ocr.dl_mb !== undefined || ocr.ul_mb !== undefined) {
                        this.applyMetricsToUI(hsId, { dl_mb_5g: ocr.dl_mb, ul_mb_5g: ocr.ul_mb });
                    }
                }
            }

            if (files4gSpd.length === 0 && files4g.length > 0) {
                for (let f of files4g) {
                    const ocr = await this.performRealImageOCR(f, 'auto');
                    if (ocr.dl_mb !== undefined || ocr.ul_mb !== undefined) {
                        this.applyMetricsToUI(hsId, { dl_mb_4g: ocr.dl_mb, ul_mb_4g: ocr.ul_mb });
                    }
                }
            }

            const statusSpan = document.getElementById(`save-status-${hsId}`);
            if (statusSpan) {
                statusSpan.innerHTML = `<span style="color: var(--success-green); font-weight: 600;">✓ Vision AI & Speedtest Extracted!</span>`;
            }
            this.showToast(`Vision AI successfully parsed telemetry & Speedtest speeds!`, 'success');
        } catch (error) {
            console.warn("OCR Exception:", error);
            this.showToast(`OCR Error: ${error.message}`, 'error');
        } finally {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
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

        const parseOrNull = (val, isFloat = false) => {
            if (val === null || val === undefined || val === '-' || val === '' || val === 'null') return null;
            const num = isFloat ? parseFloat(val) : parseInt(val);
            return isNaN(num) ? null : num;
        };

        const payload = {
            hotspot_name: hsName,
            gnb: parseOrNull(readCell(`cell-${hsId}-gnb`)),
            cid_5g: parseOrNull(readCell(`cell-${hsId}-cid_5g`)),
            pci_5g: parseOrNull(readCell(`cell-${hsId}-pci_5g`)),
            band_5g: readCell(`cell-${hsId}-band_5g`) || null,
            rsrp_5g: parseOrNull(readCell(`cell-${hsId}-rsrp_5g`), true),
            
            enb: parseOrNull(readCell(`cell-${hsId}-enb`)),
            cid: parseOrNull(readCell(`cell-${hsId}-cid`)),
            pci_4g: parseOrNull(readCell(`cell-${hsId}-pci_4g`)),
            band_4g: readCell(`cell-${hsId}-band_4g`) || null,
            rsrp_4g: parseOrNull(readCell(`cell-${hsId}-rsrp_4g`), true),
            
            dl_mb_5g: parseOrNull(readCell(`cell-${hsId}-dl_mb_5g`), true),
            ul_mb_5g: parseOrNull(readCell(`cell-${hsId}-ul_mb_5g`), true),
            dl_mb_4g: parseOrNull(readCell(`cell-${hsId}-dl_mb_4g`), true),
            ul_mb_4g: parseOrNull(readCell(`cell-${hsId}-ul_mb_4g`), true),
            
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
