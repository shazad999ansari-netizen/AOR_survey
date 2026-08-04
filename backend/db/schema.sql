-- ============================================================================
-- Enterprise Mobile-First Field Engineer Application - Azure SQL Schema
-- Compatible with Microsoft Azure SQL Database / Microsoft SQL Server (T-SQL)
-- ============================================================================

-- Create Users table with Mobile Number + RBAC Role
CREATE TABLE Users (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    mobile_number NVARCHAR(50) NOT NULL UNIQUE,
    role NVARCHAR(50) NOT NULL DEFAULT 'engineer' CHECK (role IN ('engineer', 'admin', 'manager')),
    created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Create OTPLogs table for 6-digit OTP verification & audit trail
CREATE TABLE OTPLogs (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    mobile_number NVARCHAR(50) NOT NULL,
    otp_hash NVARCHAR(255) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    is_used BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Create StoreSurveys table for hardware audits & metadata
CREATE TABLE StoreSurveys (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    store_name NVARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    repeater_present BIT DEFAULT 0,
    repeater_working BIT DEFAULT 0,
    repeater_photo_url NVARCHAR(1000) NULL,
    sc_present BIT DEFAULT 0,
    sc_working BIT DEFAULT 0,
    sc_photo_url NVARCHAR(1000) NULL,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_StoreSurveys_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Create HotspotReadings table for auto-parsed 5G/4G RF parameters across 6 hotspots
CREATE TABLE HotspotReadings (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    survey_id INT NOT NULL,
    hotspot_name NVARCHAR(100) NOT NULL, -- e.g. 'Hotspot 1: Entry gate left side'
    -- 5G Metrics
    pci_5g INT NULL,
    rsrp_5g FLOAT NULL,
    dl_mb_5g FLOAT NULL,
    ul_mb_5g FLOAT NULL,
    gnb INT NULL,
    arfcn_5g INT NULL,
    -- 4G Metrics
    enb INT NULL,
    cid INT NULL,
    arfcn_4g INT NULL,
    rsrp_4g FLOAT NULL,
    dl_mb_4g FLOAT NULL,
    ul_mb_4g FLOAT NULL,
    pci_4g INT NULL,
    -- Azure Blob Storage visual proof URLs
    snap_url_5g NVARCHAR(1000) NULL,
    snap_url_4g NVARCHAR(1000) NULL,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_HotspotReadings_StoreSurveys FOREIGN KEY (survey_id) REFERENCES StoreSurveys(id) ON DELETE CASCADE
);

-- Optimization Indexes
CREATE NONCLUSTERED INDEX IX_Users_MobileNumber ON Users(mobile_number);
CREATE NONCLUSTERED INDEX IX_OTPLogs_Mobile_Expires ON OTPLogs(mobile_number, expires_at, is_used);
CREATE NONCLUSTERED INDEX IX_StoreSurveys_UserId ON StoreSurveys(user_id);
CREATE NONCLUSTERED INDEX IX_HotspotReadings_SurveyId ON HotspotReadings(survey_id);
