// Complete Mobile API Client for Field Engineer Portal
class APIClient {
    constructor(baseURL = null) {
        if (!baseURL) {
            const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
            if (origin.startsWith('http:') || origin.startsWith('https:')) {
                this.baseURL = origin;
            } else {
                this.baseURL = 'https://field-engineer-portal.onrender.com';
            }
        } else {
            this.baseURL = baseURL;
        }
        this.token = localStorage.getItem('fe_jwt_token') || null;
        this.user = JSON.parse(localStorage.getItem('fe_user') || 'null');
    }

    setToken(token, user) {
        this.token = token;
        this.user = user;
        if (token) {
            localStorage.setItem('fe_jwt_token', token);
            localStorage.setItem('fe_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('fe_jwt_token');
            localStorage.removeItem('fe_user');
        }
    }

    async request(endpoint, options = {}) {
        const headers = options.headers || {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }

        const config = {
            ...options,
            headers
        };

        const targetUrl = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        const response = await fetch(targetUrl, config);
        
        if (response.status === 401) {
            this.setToken(null, null);
            window.dispatchEvent(new CustomEvent('auth_expired'));
            throw new Error('Session expired. Please request a new OTP code.');
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || data.message || 'API Request Failed');
            }
            return data;
        } else if (contentType.includes('text/csv') || contentType.includes('application/pdf')) {
            if (!response.ok) throw new Error('Export download failed');
            return await response.blob();
        } else {
            const text = await response.text();
            if (!response.ok) throw new Error(text || 'HTTP Request Failed');
            return text;
        }
    }

    // --- Mobile Number + OTP Authentication ---
    async sendOTP(mobileNumber) {
        return await this.request('/api/v1/auth/send-otp', {
            method: 'POST',
            body: { mobile_number: mobileNumber }
        });
    }

    async verifyOTP(mobileNumber, otpCode) {
        const data = await this.request('/api/v1/auth/verify-otp', {
            method: 'POST',
            body: { mobile_number: mobileNumber, otp_code: otpCode }
        });
        this.setToken(data.access_token, data.user);
        return data;
    }

    // --- Store Survey Operations ---
    async createSurvey(surveyData) {
        return await this.request('/api/v1/surveys', {
            method: 'POST',
            body: surveyData
        });
    }

    async getSurveys() {
        return await this.request('/api/v1/surveys');
    }

    async getSurveyDetail(surveyId) {
        return await this.request(`/api/v1/surveys/${surveyId}`);
    }

    async uploadHardwarePhoto(file) {
        const formData = new FormData();
        formData.append('file', file);
        return await this.request('/api/v1/surveys/upload-hardware-photo', {
            method: 'POST',
            body: formData
        });
    }

    // --- AI Vision OCR & Hotspots ---
    async extractHotspotData(hotspotName, snaps5g = [], snaps4g = []) {
        const formData = new FormData();
        formData.append('hotspot_name', hotspotName);
        
        if (Array.isArray(snaps5g)) {
            snaps5g.forEach(file => formData.append('snap_5g', file));
        } else if (snaps5g) {
            formData.append('snap_5g', snaps5g);
        }

        if (Array.isArray(snaps4g)) {
            snaps4g.forEach(file => formData.append('snap_4g', file));
        } else if (snaps4g) {
            formData.append('snap_4g', snaps4g);
        }

        return await this.request('/api/v1/extract-hotspot-data', {
            method: 'POST',
            body: formData
        });
    }

    async saveHotspotReading(surveyId, readingData) {
        return await this.request(`/api/v1/surveys/${surveyId}/hotspots`, {
            method: 'POST',
            body: readingData
        });
    }

    // --- Executive Reports & Analytics ---
    async getReportHTMLPreview(surveyId) {
        return await this.request(`/api/v1/surveys/${surveyId}/preview-html`);
    }

    async downloadPDFReport(surveyId, storeName = 'Audit') {
        const blob = await this.request(`/api/v1/surveys/${surveyId}/export-pdf`);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Executive_Report_${storeName.replace(/\s+/g, '_')}_#${surveyId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    }

    async downloadSingleExcelReport(surveyId, storeName = 'Audit') {
        const blob = await this.request(`/api/v1/surveys/${surveyId}/export-excel`);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Survey_#${surveyId}_${storeName.replace(/\s+/g, '_')}_Excel_Export.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    }

    async getAdminStats() {
        return await this.request('/api/v1/admin/dashboard-stats');
    }

    async downloadBulkCSV() {
        const blob = await this.request('/api/v1/admin/export-bulk-csv');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Enterprise_Bulk_RF_Audit_Export.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    }
}

const api = new APIClient();
