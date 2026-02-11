# 🔌 AbsensiQR — API Documentation

Base URL: `https://api.absensi-qr.com/api/v1`

---

## 🔐 Authentication

### POST `/auth/login`
```json
// Request
{ "email": "admin@demo.com", "password": "password", "role": "admin" }

// Response 200
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400,
  "user": { "id": 1, "name": "Administrator", "role": "admin", "email": "..." }
}

// Response 401
{ "success": false, "message": "Invalid credentials" }
```

### POST `/auth/register`
```json
// Request
{ "name": "Budi Santoso", "email": "budi@demo.com", "nip": "2024001", "department": "XII RPL 1", "password": "password123" }

// Response 201
{ "success": true, "message": "Akun berhasil dibuat", "user": { ... } }
```

### POST `/auth/logout`
```
Headers: Authorization: Bearer <token>
Response 200: { "success": true }
```

---

## 📱 QR Code

### POST `/qr/generate`
> **Admin only**
```json
// Request
{ "type": "checkin", "duration_min": 5, "location": "Ruang A" }

// Response 200
{
  "success": true,
  "qr_session": {
    "id": 42,
    "token": "QR-L9CK2X-ABCDEF",
    "type": "checkin",
    "location": "Ruang A",
    "valid_from": "2024-01-15T08:00:00Z",
    "expired_at": "2024-01-15T08:05:00Z",
    "qr_image_base64": "data:image/png;base64,..."
  }
}
```

### POST `/qr/validate`
> Scan & validasi QR Code

```json
// Request
{
  "token": "QR-L9CK2X-ABCDEF",
  "latitude": -6.2001,
  "longitude": 106.8167
}

// Response 200 — Berhasil
{
  "success": true,
  "status": "CHECKIN_SUCCESS",
  "message": "Check-in berhasil!",
  "attendance": {
    "checkin_time": "08:02:31",
    "status": "hadir",
    "late_minutes": 0
  }
}

// Response 400 — Gagal
{
  "success": false,
  "status": "EXPIRED",
  "message": "QR Code telah kedaluwarsa"
}

// Status codes:
// CHECKIN_SUCCESS, CHECKOUT_SUCCESS
// EXPIRED, INVALID, DUPLICATE
// ALREADY_CHECKIN, NOT_CHECKIN, ALREADY_CHECKOUT
// GPS_OUT_OF_RANGE
```

### GET `/qr/history`
> Admin: semua history | User: history sendiri
```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 42,
      "token": "QR-L9CK2X-ABCDEF",
      "type": "checkin",
      "location": "Ruang A",
      "created_at": "2024-01-15T08:00:00Z",
      "expired_at": "2024-01-15T08:05:00Z",
      "scan_count": 5,
      "is_expired": true
    }
  ]
}
```

---

## 📋 Attendance

### GET `/attendance`
> Query params: `date`, `user_id`, `status`, `page`, `per_page`
```json
{
  "success": true,
  "total": 150,
  "page": 1,
  "per_page": 20,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "user_name": "Budi Santoso",
      "nip": "2024001",
      "department": "XII RPL 1",
      "date": "2024-01-15",
      "checkin_time": "08:00",
      "checkout_time": "17:02",
      "status": "hadir",
      "late_minutes": 0,
      "work_duration": 542
    }
  ]
}
```

### GET `/attendance/today`
> Absensi hari ini (semua user)

### GET `/attendance/stats`
> Statistik hari ini
```json
{
  "success": true,
  "date": "2024-01-15",
  "total_users": 30,
  "hadir": 24,
  "telat": 3,
  "alfa": 3,
  "attendance_rate": 90.0
}
```

### POST `/attendance` (Manual entry)
> **Admin only**
```json
{
  "user_id": 2,
  "date": "2024-01-15",
  "checkin_time": "08:00",
  "checkout_time": "17:00",
  "status": "hadir",
  "note": "Input manual"
}
```

### PUT `/attendance/:id`
> **Admin only** — Edit data absensi

### DELETE `/attendance/:id`
> **Admin only** — Hapus data

### GET `/attendance/export`
> Query: `format=pdf|excel`, `date_from`, `date_to`, `user_id`

---

## 👥 Users (Admin only)

### GET `/users`
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Budi", "email": "budi@demo.com", "nip": "2024001", "department": "XII RPL 1", "role": "user", "is_active": true }
  ]
}
```

### POST `/users`
```json
{ "name": "...", "email": "...", "nip": "...", "department": "...", "password": "...", "role": "user" }
```

### PUT `/users/:id`
```json
{ "name": "...", "department": "...", "is_active": true }
```

### DELETE `/users/:id`

---

## ⚙️ Settings (Admin only)

### GET `/settings`
### PUT `/settings`
```json
{
  "checkin_time": "08:00",
  "checkout_time": "17:00",
  "late_tolerance_minutes": 15,
  "gps_validation": true,
  "gps_radius_meters": 100,
  "office_latitude": -6.200000,
  "office_longitude": 106.816666
}
```

---

## 🔑 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request / Validasi gagal |
| 401 | Unauthorized / Token invalid |
| 403 | Forbidden / Role tidak sesuai |
| 404 | Not Found |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## 🛡️ Auth Header

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
```
