# 🏫 AbsensiQR — Sistem Absensi Online Berbasis QR Code

> Sistem absensi modern yang lengkap, aman, dan siap pakai untuk sekolah & perusahaan.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-production--ready-green)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## 📸 Preview

| Halaman | Deskripsi |
|---------|-----------|
| 🔐 Login/Register | Auth dengan role-based access |
| 📊 Dashboard Admin | Statistik, grafik, data real-time |
| 📱 Generate QR | QR dengan countdown timer & fullscreen |
| 📋 Data Absensi | Tabel filter + export PDF/CSV |
| 👥 Kelola User | CRUD pengguna |
| 📸 Scan QR | Kamera HP + validasi real-time |
| 📅 Riwayat | Histori per pengguna |
| 🌙 Dark Mode | Toggle theme |

---

## ✨ Fitur Lengkap

### 🔐 Autentikasi & Keamanan
- Login dengan email/NIP + password
- Register akun baru dengan validasi
- Role-based access: **Admin** & **User/Karyawan**
- Auto logout saat idle (5 menit warning, 6 menit logout)
- Session management via `sessionStorage`
- Password hashing (production: gunakan bcrypt)

### 📱 QR Code
- Generate QR Code unik per sesi (token UUID)
- Expired time configurable (2, 5, 10, 30 menit)
- Countdown visual dengan ring progress
- **Anti-exploit:**
  - ❌ Tidak bisa dipakai ulang
  - ❌ Tidak bisa scan lebih dari 1x per hari
  - ❌ Expired setelah waktu ditentukan
- Download QR Code sebagai PNG
- Mode fullscreen untuk ditampilkan di proyektor

### 🕒 Absensi
- Check-in & Check-out via scan QR
- Status otomatis: **Hadir / Terlambat / Alfa**
- Deteksi keterlambatan vs toleransi (configurable)
- Hitung durasi kerja otomatis
- Riwayat absensi lengkap per user

### 📊 Dashboard Admin
- Statistik real-time: Total, Hadir, Terlambat, Alfa
- Grafik bar mingguan (Chart.js)
- Grafik donut distribusi status
- Grafik line bulanan
- Top 5 kehadiran terbaik

### 📋 Manajemen Data
- Filter absensi: tanggal, nama, status
- Edit & hapus data absensi
- Export **PDF** (jsPDF)
- Export **Excel/CSV**
- Riwayat QR Code

### 📍 GPS Validasi (Bonus)
- Cek radius lokasi sebelum scan
- Configurable radius (default 100m)
- Mode demo (GPS off untuk testing)

---

## 🛠️ Teknologi

```
Frontend:  HTML5 + CSS3 (Custom Design System) + Vanilla JS ES6+
Charts:    Chart.js v4.4.1
QR Gen:    qrcode.js v1.0.0
QR Scan:   jsQR v1.4.0
Export:    jsPDF v2.5.1
Fonts:     Syne (heading) + DM Sans (body)
```

> **Demo version** ini adalah single-file HTML yang berjalan sepenuhnya di browser.
> Untuk produksi, gunakan backend (Laravel/Node.js) + database (MySQL/PostgreSQL).

---

## 🚀 Cara Menjalankan

### Demo (Single HTML)
```bash
# Cukup buka file di browser
open index.html
# atau
double-click index.html
```

### Production Backend (Laravel)
```bash
composer create-project laravel/laravel absensi-qr
cd absensi-qr
# Salin file dari folder /backend-laravel
php artisan migrate --seed
php artisan serve
```

### Production Backend (Node.js)
```bash
npm init -y
npm install express sequelize mysql2 jsonwebtoken bcrypt qrcode
# Salin file dari folder /backend-node
node server.js
```

---

## 👤 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | password |
| Karyawan | budi@demo.com | password |
| Karyawan | siti@demo.com | password |

---

## 🗂️ Struktur Folder

```
absensi-qr/
├── index.html              # ← Aplikasi lengkap (demo)
├── README.md               # Dokumentasi
├── database.sql            # Schema database
├── api-docs.md             # Dokumentasi API
│
├── backend-laravel/        # (Production backend)
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── AttendanceController.php
│   │   │   └── QRCodeController.php
│   │   └── Models/
│   ├── database/migrations/
│   └── routes/api.php
│
└── backend-node/           # (Production backend)
    ├── src/
    │   ├── routes/
    │   ├── controllers/
    │   └── middleware/
    └── server.js
```

---

## 🗄️ Desain Database

Lihat file `database.sql` untuk schema lengkap.

**Tabel utama:**
- `users` — Data pengguna (admin & karyawan)
- `attendance` — Record absensi harian
- `qr_sessions` — Log QR Code yang digenerate
- `qr_scans` — Log setiap scan QR
- `settings` — Konfigurasi sistem

---

## 🔌 API Endpoints

Lihat file `api-docs.md` untuk dokumentasi lengkap.

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout

GET  /api/attendance
POST /api/attendance/check-in
POST /api/attendance/check-out
PUT  /api/attendance/:id

GET  /api/qr/generate
POST /api/qr/validate
GET  /api/qr/history

GET  /api/users
POST /api/users
PUT  /api/users/:id
DELETE /api/users/:id
```

---

## 🔒 Keamanan

- ✅ Input validation & sanitization
- ✅ CSRF Protection (Laravel) / Helmet.js (Node)
- ✅ Rate limiting pada endpoint login
- ✅ JWT token expiry
- ✅ QR Token one-time use
- ✅ Role-based authorization middleware
- ✅ SQL injection prevention (ORM)
- ✅ XSS prevention

---

## 📱 UI/UX Highlights

- **Mobile-first** responsive design
- **Dark Mode** toggle
- Smooth animations & micro-interactions
- Toast notifications real-time
- Loading states & empty states
- Countdown ring untuk QR timer
- Camera scan dengan scan-line animation

---

## 📄 License

MIT License — Bebas digunakan untuk portfolio & produksi.

---

> Dibuat dengan ❤️ untuk keperluan portfolio Software Engineer
