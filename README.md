# 🎪 ระบบจองล็อกตลาดนัดคนเดิน จ.ศรีสะเกษ

ระบบจองพื้นที่ขายสินค้าออนไลน์สำหรับตลาดนัด รองรับการจองแยกวันเสาร์-อาทิตย์ พร้อมระบบตรวจสลิปอัตโนมัติด้วย OCR

---

## 🛠️ เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | MongoDB + Mongoose |
| Authentication | NextAuth.js (Credentials) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| OCR | Tesseract.js |
| QR Code | qrcode.react |
| Notifications | Sonner |

---

## ✨ ฟีเจอร์หลัก

### 👤 ฝั่งผู้ค้า (User)
- **สมัครสมาชิก / เข้าสู่ระบบ** พร้อมเก็บข้อมูลชื่อและเบอร์โทรศัพท์
- **ดูแผนผังตลาด** แบบ Interactive แยกดูตามวันเสาร์หรืออาทิตย์
- **จองล็อก** โดยเลือกรอบการจองได้ (เสาร์, อาทิตย์, หรือทั้งคู่)
- **ระบบจับเวลา 15 นาที** หากไม่ชำระเงินภายในเวลาที่กำหนด ระบบคืนพื้นที่อัตโนมัติ
- **อัปโหลดสลิป** พร้อมตรวจสอบยอดเงินอัตโนมัติด้วย OCR (Tesseract.js)
- **ดูประวัติการจอง** กรองตามเดือนได้

### 🛡️ ฝั่งแอดมิน (Admin)
- **Dashboard** แสดงภาพรวมรายได้, จำนวนล็อก, กราฟแท่ง, และ Pie Chart
- **ตรวจสอบสลิป** อนุมัติหรือปฏิเสธการจองพร้อม Modal ยืนยัน
- **Strict Delete** ต้องพิมพ์คำยืนยันก่อนยกเลิกรายการที่อนุมัติไปแล้ว
- **จัดการผังตลาด** เพิ่ม / แก้ไข / ลบล็อก
- **ตั้งค่ารอบการจอง** กำหนดเวลาเปิด-ปิดระบบ
- **Auto-Reset** ระบบล้างกระดานและเปิดรอบใหม่อัตโนมัติเมื่อถึงเวลาที่กำหนด
- **ล้างกระดานฉุกเฉิน** (Manual Reset) พร้อมระบบยืนยัน 2 ชั้น
- **ประวัติการจองทั้งหมด** ค้นหาและกรองตามเดือน

---

## 🚀 วิธีติดตั้งและรันโปรเจกต์

### 1. Clone โปรเจกต์

```bash
git clone <your-repo-url>
cd <project-folder>
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ที่ root ของโปรเจกต์:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Seed ข้อมูลเริ่มต้น (ไม่บังคับ)

เรียก API เพื่อสร้างล็อกตัวอย่าง:

```
GET http://localhost:3000/api/seed
```

### 5. รันโปรเจกต์

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:3000`

---

## 👑 การสร้างบัญชีแอดมิน

เนื่องจากระบบไม่มีหน้าสร้างแอดมิน ให้แก้ไขข้อมูลใน MongoDB โดยตรง:

```javascript
// ใน MongoDB Atlas หรือ Compass
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

---

## 📁 โครงสร้างโปรเจกต์

```
src/
├── app/
│   ├── page.tsx                  # หน้า Landing Page
│   ├── login/page.tsx            # หน้าเข้าสู่ระบบ
│   ├── register/page.tsx         # หน้าสมัครสมาชิก
│   ├── booking/page.tsx          # หน้าจองล็อก (ผู้ค้า)
│   ├── my-bookings/page.tsx      # หน้าประวัติการจอง (ผู้ค้า)
│   ├── admin/
│   │   ├── layout.tsx            # Layout แอดมิน (Sidebar)
│   │   ├── page.tsx              # Dashboard
│   │   ├── bookings/page.tsx     # ตรวจสอบสลิปรอบปัจจุบัน
│   │   ├── history/page.tsx      # ประวัติการจองทั้งหมด
│   │   ├── stalls/page.tsx       # จัดการผังตลาด
│   │   └── settings/page.tsx     # ตั้งค่ารอบการจอง
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth
│       ├── register/             # สมัครสมาชิก
│       ├── stalls/               # ดึงข้อมูลล็อก + Auto-Reset
│       ├── bookings/             # จองล็อก / ดึงรายการจอง
│       ├── bookings/cancel/      # ยกเลิกการจอง
│       ├── payment/              # ส่งสลิปและบันทึกการชำระเงิน
│       ├── my-bookings/          # ประวัติการจองของผู้ใช้
│       ├── admin/bookings/       # ดึงข้อมูลสลิปสำหรับแอดมิน
│       ├── admin/manage/         # อนุมัติ / ปฏิเสธสลิป
│       ├── admin/stalls/         # CRUD ล็อก
│       ├── admin/settings/       # ตั้งค่าระบบ / ล้างกระดาน
│       └── seed/                 # สร้างข้อมูลตัวอย่าง
├── components/
│   ├── AuthProvider.tsx          # SessionProvider wrapper
│   ├── ThemeProvider.tsx         # Dark Mode provider
│   └── UserNavbar.tsx            # Navbar ผู้ใช้
├── lib/
│   └── mongodb.ts                # เชื่อมต่อ MongoDB
├── models/
│   ├── Booking.ts                # Schema การจอง
│   ├── Setting.ts                # Schema ตั้งค่าระบบ
│   ├── Stall.ts                  # Schema ล็อกพื้นที่
│   └── User.ts                   # Schema ผู้ใช้
└── middleware.ts                 # ป้องกัน Route ที่ต้อง Login
```

---

## 🔄 Flow การทำงานของระบบ

```
ผู้ค้าเลือกล็อก
    ↓
เลือกรอบวัน (เสาร์ / อาทิตย์ / ทั้งคู่)
    ↓
ระบบล็อคสถานะเป็น "pending" (15 นาที)
    ↓
ผู้ค้าโอนเงินและอัปโหลดสลิป
    ↓
OCR ตรวจยอดเงินอัตโนมัติ
    ├── ผ่าน → อนุมัติทันที ✅
    └── ไม่ผ่าน → รอแอดมินตรวจ ⏳
                      ↓
              แอดมินอนุมัติ / ปฏิเสธ
```

---

## ⚙️ ระบบ Auto-Reset

ระบบจะล้างกระดานอัตโนมัติ (คืนสถานะล็อกทั้งหมดเป็น `available`) เมื่อ:

1. **ถึงเวลาเปิดรอบใหม่** ที่แอดมินตั้งไว้ใน Settings
2. **แอดมินกดล้างกระดานฉุกเฉิน** (Manual Reset)

การตรวจสอบเกิดขึ้นทุกครั้งที่มีการเรียก `GET /api/stalls`

---

## 🔐 ระบบความปลอดภัย

- Route `/booking` และ `/admin` ถูกป้องกันด้วย `middleware.ts`
- การลบรายการที่อนุมัติแล้วต้องพิมพ์คำว่า **"ยืนยัน"** เพื่อยืนยัน
- การล้างกระดานฉุกเฉินต้องพิมพ์คำว่า **"ล้างกระดาน"** เพื่อยืนยัน
- การตั้งค่าเวลาต้องพิมพ์คำว่า **"ยืนยัน"** เพื่อยืนยัน

---

## 📸 หน้าจอหลักของระบบ

| หน้า | คำอธิบาย |
|------|---------|
| `/` | Landing Page แนะนำระบบ |
| `/booking` | แผนผังตลาดและหน้าจองล็อก |
| `/my-bookings` | ประวัติการจองของผู้ค้า |
| `/admin` | Dashboard สรุปภาพรวม |
| `/admin/bookings` | ตรวจสอบและอนุมัติสลิป |
| `/admin/history` | ประวัติการจองทั้งหมด |
| `/admin/stalls` | จัดการล็อกพื้นที่ |
| `/admin/settings` | ตั้งค่ารอบการจอง |

---

## 📝 License

โปรเจกต์นี้พัฒนาเพื่อการใช้งานภายในของตลาดนัดคนเดิน จังหวัดศรีสะเกษ