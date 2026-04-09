# RealDash – India Tourism Offices Real-Time Monitoring Dashboard

> **Ministry of Tourism, Government of India**
> Real-time performance monitoring for all 20 India Tourism Offices (ITOs) against their Annual Action Plan (AAP).

---

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS + Recharts     |
| Backend    | Node.js + Express.js                          |
| Database   | MongoDB Atlas (Mongoose ODM)                  |
| Real-time  | Socket.io (WebSocket)                         |
| Auth       | JWT + bcryptjs                                |
| Reports    | ExcelJS (Excel export)                        |
| Deployment | Render / Railway (backend) + Vercel (frontend)|

---

## Project Structure

```
realdash/
├── server/                    # Express API
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── activityController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   └── auth.js            # JWT protect + authorize
│   ├── models/
│   │   ├── Office.js          # 20 ITO profiles
│   │   ├── Activity.js        # Daily entries
│   │   ├── AAPTarget.js       # Annual Action Plan
│   │   ├── User.js            # Roles: superadmin/ministry/office_admin/staff/viewer
│   │   └── Alert.js           # Notifications
│   ├── routes/
│   │   ├── auth.js
│   │   ├── offices.js
│   │   ├── activities.js
│   │   ├── aap.js
│   │   ├── dashboard.js
│   │   ├── reports.js         # + Excel export
│   │   └── alerts.js
│   ├── utils/
│   │   ├── socket.js          # Socket.io init
│   │   └── seeder.js          # Seed all 20 offices + demo data
│   ├── index.js               # Entry point
│   └── package.json
│
└── client/                    # React frontend
    ├── src/
    │   ├── components/
    │   │   ├── shared/
    │   │   │   ├── Layout.jsx  # Sidebar + navigation
    │   │   │   └── UI.jsx      # Reusable components
    │   │   └── offices/
    │   │       └── ActivityForm.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── SocketContext.jsx
    │   ├── hooks/
    │   │   └── useDashboard.js  # Data hooks + socket listeners
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── DashboardPage.jsx  # 20 office cards + KPIs + charts
    │   │   ├── OfficePage.jsx     # Individual office detail
    │   │   ├── ActivitiesPage.jsx # Filtered activity log
    │   │   ├── AAPPage.jsx        # Targets by category/quarter
    │   │   ├── ReportsPage.jsx    # Charts + Excel export
    │   │   ├── AlertsPage.jsx     # Notifications center
    │   │   └── AdminPage.jsx      # User & office management
    │   ├── services/
    │   │   └── api.js            # Axios with auth interceptor
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    └── package.json
```

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo-url>
cd realdash

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT secret
```

### 3. Seed the database

```bash
cd server
npm run seed
```

This creates:
- All **20 India Tourism Offices**
- Sample **AAP targets** for FY 2024-25
- Sample **activities** (15–40 per office)
- **Demo users** (see below)
- Sample **alerts**

### 4. Run in development

```bash
# Terminal 1 – backend
cd server && npm run dev

# Terminal 2 – frontend
cd client && npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

---

## Login Credentials

| Role          | Email                               | Password     |
|---------------|-------------------------------------|--------------|
| Super Admin   | admin@tourism.gov.in                | Admin@123    |
| Ministry      | ministry@tourism.gov.in             | Ministry@123 |
| Office Admin  | admin.del@tourism.gov.in            | Office@123   |
| Office Admin  | admin.mum@tourism.gov.in            | Office@123   |

---

## All 20 India Tourism Offices

| Code      | City         | State                 | Region    |
|-----------|--------------|-----------------------|-----------|
| ITO-DEL   | New Delhi    | Delhi                 | North     |
| ITO-MUM   | Mumbai       | Maharashtra           | West      |
| ITO-CHE   | Chennai      | Tamil Nadu            | South     |
| ITO-KOL   | Kolkata      | West Bengal           | East      |
| ITO-BLR   | Bengaluru    | Karnataka             | South     |
| ITO-HYD   | Hyderabad    | Telangana             | South     |
| ITO-AGR   | Agra         | Uttar Pradesh         | North     |
| ITO-VNS   | Varanasi     | Uttar Pradesh         | North     |
| ITO-JAI   | Jaipur       | Rajasthan             | North     |
| ITO-GOA   | Panaji       | Goa                   | West      |
| ITO-AUR   | Aurangabad   | Maharashtra           | West      |
| ITO-PAT   | Patna        | Bihar                 | East      |
| ITO-BHU   | Bhubaneswar  | Odisha                | East      |
| ITO-GUW   | Guwahati     | Assam                 | Northeast |
| ITO-KOC   | Kochi        | Kerala                | South     |
| ITO-CHD   | Chandigarh   | Punjab                | North     |
| ITO-JAM   | Jammu        | J&K                   | North     |
| ITO-KHA   | Khajuraho    | Madhya Pradesh        | Central   |
| ITO-TIR   | Tirupati     | Andhra Pradesh        | South     |
| ITO-PBL   | Port Blair   | Andaman & Nicobar     | East      |

---

## User Roles

| Role          | Access                                                |
|---------------|-------------------------------------------------------|
| `superadmin`  | Full access – all offices, users, config              |
| `ministry`    | Read all + create alerts + export reports             |
| `office_admin`| Own office only – CRUD activities + AAP targets       |
| `office_staff`| Own office only – log activities                      |
| `viewer`      | Read-only across all offices                          |

---

## API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Dashboard
```
GET /api/dashboard/summary?financialYear=2024-25
GET /api/dashboard/trends?days=30&officeId=<id>
GET /api/dashboard/category-breakdown?officeId=<id>
```

### Offices
```
GET    /api/offices
GET    /api/offices/:id
POST   /api/offices
PUT    /api/offices/:id
```

### Activities
```
GET    /api/activities?officeId=&category=&status=&from=&to=&page=&limit=
POST   /api/activities
PUT    /api/activities/:id
DELETE /api/activities/:id
```

### AAP Targets
```
GET    /api/aap?officeId=&financialYear=
POST   /api/aap
PUT    /api/aap/:id
DELETE /api/aap/:id
```

### Reports
```
GET /api/reports/office-performance?financialYear=
GET /api/reports/export-excel?financialYear=   → downloads .xlsx
```

### Alerts
```
GET   /api/alerts
POST  /api/alerts
PATCH /api/alerts/:id/read
PATCH /api/alerts/mark-all-read
```

---

## Real-Time Events (Socket.io)

| Event              | Direction       | Payload               |
|--------------------|-----------------|-----------------------|
| `activity:new`     | Server → Client | Activity object       |
| `activity:updated` | Server → Client | Activity object       |
| `activity:deleted` | Server → Client | `{ id }`              |
| `alert:new`        | Server → Client | Alert object          |
| `join:ministry`    | Client → Server | —                     |
| `join:office`      | Client → Server | officeId              |

---

## AAP Activity Categories

1. Tourism Promotion
2. Tourist Facilitation
3. Media & Publicity
4. Fairs & Festivals
5. Training & Capacity Building
6. Infrastructure Development
7. Market Development Assistance
8. Survey & Research
9. Coordination
10. Other

---

## Deployment

### Backend (Render / Railway)
```bash
# Build command: npm install
# Start command: node index.js
# Environment variables: MONGO_URI, JWT_SECRET, CLIENT_ORIGIN
```

### Frontend (Vercel / Netlify)
```bash
# Build command: npm run build
# Output directory: dist
# Environment: VITE_API_URL=https://your-backend-url.com
```

---

*RealDash · Ministry of Tourism, Government of India · Built with MERN Stack*
