-- ═══════════════════════════════════════════════════════════════
--  AbsensiQR — Database Schema
--  Compatible: MySQL 8.0+ / PostgreSQL 14+
-- ═══════════════════════════════════════════════════════════════

-- Drop order (reverse FK order)
DROP TABLE IF EXISTS qr_scans;
DROP TABLE IF EXISTS qr_sessions;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;

-- ──────────────────────────────────────────────────────────────
--  USERS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE users (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    nip           VARCHAR(30)   NOT NULL UNIQUE COMMENT 'Nomor Induk Pegawai/Siswa',
    department    VARCHAR(100)  DEFAULT NULL,
    password_hash VARCHAR(255)  NOT NULL COMMENT 'bcrypt hashed password',
    role          ENUM('admin','user') NOT NULL DEFAULT 'user',
    is_active     TINYINT(1)    NOT NULL DEFAULT 1,
    avatar_url    VARCHAR(255)  DEFAULT NULL,
    last_login_at DATETIME      DEFAULT NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email    (email),
    INDEX idx_nip      (nip),
    INDEX idx_role     (role),
    INDEX idx_active   (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
--  QR CODE SESSIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE qr_sessions (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    token        VARCHAR(64)  NOT NULL UNIQUE COMMENT 'UUID token unik per sesi',
    type         ENUM('checkin','checkout') NOT NULL,
    location     VARCHAR(150) DEFAULT 'Main Office',
    created_by   BIGINT UNSIGNED NOT NULL,
    valid_from   DATETIME     NOT NULL,
    expired_at   DATETIME     NOT NULL,
    duration_min SMALLINT     NOT NULL DEFAULT 5 COMMENT 'Durasi valid dalam menit',
    is_active    TINYINT(1)   NOT NULL DEFAULT 1,
    scan_count   INT UNSIGNED NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token      (token),
    INDEX idx_expired    (expired_at),
    INDEX idx_type       (type),
    INDEX idx_active     (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
--  QR SCANS LOG
-- ──────────────────────────────────────────────────────────────
CREATE TABLE qr_scans (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    qr_session_id  BIGINT UNSIGNED NOT NULL,
    user_id        BIGINT UNSIGNED NOT NULL,
    scan_type      ENUM('checkin','checkout') NOT NULL,
    scanned_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address     VARCHAR(45)  DEFAULT NULL,
    user_agent     VARCHAR(255) DEFAULT NULL,
    latitude       DECIMAL(10,8) DEFAULT NULL,
    longitude      DECIMAL(11,8) DEFAULT NULL,
    gps_accuracy   FLOAT         DEFAULT NULL COMMENT 'meters',
    is_valid       TINYINT(1)   NOT NULL DEFAULT 1,
    reject_reason  VARCHAR(100)  DEFAULT NULL,
    FOREIGN KEY (qr_session_id) REFERENCES qr_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
    UNIQUE KEY uq_user_session (user_id, qr_session_id),
    INDEX idx_user    (user_id),
    INDEX idx_session (qr_session_id),
    INDEX idx_date    (scanned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
--  ATTENDANCE
-- ──────────────────────────────────────────────────────────────
CREATE TABLE attendance (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    date            DATE         NOT NULL,
    checkin_time    TIME         DEFAULT NULL,
    checkout_time   TIME         DEFAULT NULL,
    status          ENUM('hadir','telat','alfa','izin','sakit') NOT NULL DEFAULT 'alfa',
    late_minutes    SMALLINT     NOT NULL DEFAULT 0 COMMENT 'Jumlah menit keterlambatan',
    work_duration   SMALLINT     DEFAULT NULL COMMENT 'Durasi kerja dalam menit',
    checkin_qr_id   BIGINT UNSIGNED DEFAULT NULL,
    checkout_qr_id  BIGINT UNSIGNED DEFAULT NULL,
    photo_url       VARCHAR(255) DEFAULT NULL COMMENT 'Foto saat scan (opsional)',
    note            TEXT         DEFAULT NULL,
    is_manual       TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = diinput manual oleh admin',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)        REFERENCES users(id)       ON DELETE CASCADE,
    FOREIGN KEY (checkin_qr_id)  REFERENCES qr_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (checkout_qr_id) REFERENCES qr_sessions(id) ON DELETE SET NULL,
    UNIQUE KEY uq_user_date (user_id, date),
    INDEX idx_user   (user_id),
    INDEX idx_date   (date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
--  SYSTEM SETTINGS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE settings (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    key_name    VARCHAR(80)  NOT NULL UNIQUE,
    value       TEXT         NOT NULL,
    description VARCHAR(200) DEFAULT NULL,
    updated_by  BIGINT UNSIGNED DEFAULT NULL,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ──────────────────────────────────────────────────────────────
--  SEED DATA
-- ──────────────────────────────────────────────────────────────

-- Default settings
INSERT INTO settings (key_name, value, description) VALUES
('checkin_time',          '08:00',    'Jam masuk normal'),
('checkout_time',         '17:00',    'Jam pulang normal'),
('late_tolerance_minutes','15',       'Toleransi keterlambatan (menit)'),
('gps_validation',        'false',    'Aktifkan validasi GPS'),
('gps_radius_meters',     '100',      'Radius lokasi yang diizinkan (meter)'),
('office_latitude',       '-6.200000','Latitude lokasi kantor/sekolah'),
('office_longitude',      '106.816666','Longitude lokasi kantor/sekolah'),
('qr_default_duration',   '5',        'Durasi default QR Code (menit)'),
('allow_photo_capture',   'false',    'Ambil foto saat scan QR'),
('app_name',              'AbsensiQR','Nama aplikasi'),
('app_version',           '1.0.0',    'Versi aplikasi');

-- Demo users (password: "password" bcrypt hashed)
INSERT INTO users (name, email, nip, department, password_hash, role, is_active) VALUES
('Administrator',  'admin@demo.com', 'ADM001', 'IT Department', '$2y$10$LtlQ1MriqkVBkWCqYMVeSOIFgCGZLHO3sJQsJeaFy8BzK78b7e3c2', 'admin', 1),
('Budi Santoso',   'budi@demo.com',  '2024001','XII RPL 1',     '$2y$10$LtlQ1MriqkVBkWCqYMVeSOIFgCGZLHO3sJQsJeaFy8BzK78b7e3c2', 'user',  1),
('Siti Rahma',     'siti@demo.com',  '2024002','XII RPL 1',     '$2y$10$LtlQ1MriqkVBkWCqYMVeSOIFgCGZLHO3sJQsJeaFy8BzK78b7e3c2', 'user',  1),
('Andi Wijaya',    'andi@demo.com',  '2024003','XII TKJ 2',     '$2y$10$LtlQ1MriqkVBkWCqYMVeSOIFgCGZLHO3sJQsJeaFy8BzK78b7e3c2', 'user',  1),
('Dewi Kusuma',    'dewi@demo.com',  '2024004','XII TKJ 2',     '$2y$10$LtlQ1MriqkVBkWCqYMVeSOIFgCGZLHO3sJQsJeaFy8BzK78b7e3c2', 'user',  1),
('Reza Pratama',   'reza@demo.com',  '2024005','XII MM 1',      '$2y$10$LtlQ1MriqkVBkWCqYMVeSOIFgCGZLHO3sJQsJeaFy8BzK78b7e3c2', 'user',  0);

-- ──────────────────────────────────────────────────────────────
--  USEFUL VIEWS
-- ──────────────────────────────────────────────────────────────

-- View: Absensi hari ini
CREATE OR REPLACE VIEW v_today_attendance AS
SELECT
    a.id,
    u.name AS user_name,
    u.nip,
    u.department,
    a.date,
    a.checkin_time,
    a.checkout_time,
    a.status,
    a.late_minutes,
    a.work_duration,
    TIMESTAMPDIFF(MINUTE, a.checkin_time, IFNULL(a.checkout_time, NOW())) AS elapsed_min
FROM attendance a
JOIN users u ON a.user_id = u.id
WHERE a.date = CURDATE()
ORDER BY a.checkin_time ASC;

-- View: Statistik kehadiran per user (bulan ini)
CREATE OR REPLACE VIEW v_monthly_stats AS
SELECT
    u.id,
    u.name,
    u.nip,
    u.department,
    COUNT(CASE WHEN a.status = 'hadir' THEN 1 END) AS hadir_count,
    COUNT(CASE WHEN a.status = 'telat' THEN 1 END) AS telat_count,
    COUNT(CASE WHEN a.status = 'alfa'  THEN 1 END) AS alfa_count,
    COUNT(a.id) AS total_records,
    ROUND(
        COUNT(CASE WHEN a.status IN ('hadir','telat') THEN 1 END) / 22 * 100, 1
    ) AS attendance_pct
FROM users u
LEFT JOIN attendance a ON u.id = a.user_id
    AND YEAR(a.date)  = YEAR(CURDATE())
    AND MONTH(a.date) = MONTH(CURDATE())
WHERE u.role = 'user' AND u.is_active = 1
GROUP BY u.id, u.name, u.nip, u.department
ORDER BY attendance_pct DESC;

-- ──────────────────────────────────────────────────────────────
--  STORED PROCEDURE: Scan QR
-- ──────────────────────────────────────────────────────────────
DELIMITER $$
CREATE PROCEDURE sp_process_qr_scan(
    IN p_token     VARCHAR(64),
    IN p_user_id   BIGINT UNSIGNED,
    IN p_latitude  DECIMAL(10,8),
    IN p_longitude DECIMAL(11,8),
    OUT p_status   VARCHAR(50),
    OUT p_message  VARCHAR(200)
)
BEGIN
    DECLARE v_qr_id      BIGINT UNSIGNED;
    DECLARE v_qr_type    VARCHAR(20);
    DECLARE v_exp        DATETIME;
    DECLARE v_scan_count INT;
    DECLARE v_today_rec  INT;
    DECLARE v_checkin    TIME;

    -- 1. Find QR session
    SELECT id, type, expired_at, scan_count
    INTO v_qr_id, v_qr_type, v_exp, v_scan_count
    FROM qr_sessions WHERE token = p_token AND is_active = 1 LIMIT 1;

    IF v_qr_id IS NULL THEN
        SET p_status = 'INVALID', p_message = 'QR Code tidak ditemukan';
        LEAVE sp_label;
    END IF;

    -- 2. Check expiry
    IF NOW() > v_exp THEN
        SET p_status = 'EXPIRED', p_message = 'QR Code telah kedaluwarsa';
        LEAVE sp_label;
    END IF;

    -- 3. Check already scanned by this user
    IF EXISTS (SELECT 1 FROM qr_scans WHERE qr_session_id = v_qr_id AND user_id = p_user_id) THEN
        SET p_status = 'DUPLICATE', p_message = 'Anda sudah scan QR ini';
        LEAVE sp_label;
    END IF;

    -- 4. Check today attendance
    SELECT id, checkin_time INTO v_today_rec, v_checkin
    FROM attendance WHERE user_id = p_user_id AND date = CURDATE();

    IF v_qr_type = 'checkin' AND v_checkin IS NOT NULL THEN
        SET p_status = 'ALREADY_CHECKIN', p_message = CONCAT('Sudah check-in pukul ', v_checkin);
        LEAVE sp_label;
    END IF;

    IF v_qr_type = 'checkout' AND v_checkin IS NULL THEN
        SET p_status = 'NOT_CHECKIN', p_message = 'Belum melakukan check-in';
        LEAVE sp_label;
    END IF;

    SET p_status = 'SUCCESS', p_message = 'OK';

END$$
DELIMITER ;
