# Manufacturing HRMS

Production-grade HRMS for manufacturing companies built with MERN stack.

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Ant Design, TanStack Query, Zustand
- **Backend:** Express, TypeScript, MongoDB, Mongoose
- **Database:** MongoDB Atlas
- **File Storage:** Cloudinary (images)
- **PDF Generation:** Puppeteer
- **Excel Export:** ExcelJS

## Features

### Core Modules
- **Authentication** - JWT-based login/logout with role-based access
- **User Management** - Create, update, delete users with role assignment
- **Employee Management** - Full CRUD with photo upload
- **Organization** - Departments, Designations, Shifts (master data)
- **Attendance** - Manual entry from physical register, bulk entry by date
- **Overtime** - Rules configuration and entry tracking
- **Payroll** - Monthly processing, salary calculation, slip generation
- **Reports** - Excel export for employees, attendance, payroll
- **Settings** - Company info, payroll configuration
- **Audit Logs** - Track all system activities
- **Notifications** - In-app notifications with badge

### User Roles
- Super Admin - Full system access
- HR Admin - HR operations and user management
- HR Staff - Daily attendance and entry
- Accounts - Payroll processing
- Manager - View only access

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Cloudinary account (for file uploads)
- (Optional) SendGrid/Mailtrap for emails

### Installation

1. Clone the repository
2. Install dependencies for both client and server

```bash
# Client
cd client && npm install

# Server
cd server && npm install
```

3. Copy and configure environment files

```bash
# Client
cp client/.env.example client/.env

# Server
cp server/.env.example server/.env
```

4. Update `.env` files with your credentials

**Server .env:**
```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@company.com
```

**Client .env:**
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=HRMS
```

5. Run the application

```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

6. Seed the database

```bash
cd server && npm run seed
```

## Default Login

- **Email:** admin@hrms.com
- **Password:** admin123

## Project Structure

```
HRMS/
├── client/                 # React frontend
│   └── src/
│       ├── core/          # API, stores, hooks, components
│       ├── features/      # Feature modules
│       └── layout/        # App layout
├── server/                 # Express backend
│   └── src/
│       ├── core/          # Core services (audit, cache, etc.)
│       ├── modules/       # Feature modules
│       ├── models/        # Mongoose models
│       └── config/        # Configuration
└── docs/                   # Documentation (not in git)
```

## Available Scripts

### Server
```bash
npm run dev     # Start development server
npm run build  # Build for production
npm run seed   # Seed database
```

### Client
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run lint   # Run linter
```

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | POST /auth/login, /auth/logout, GET /auth/me |
| Users | GET/POST /users, GET/PUT/DELETE /users/:id |
| Employees | GET/POST /employees, GET/PUT/DELETE /employees/:id |
| Departments | GET/POST /departments, GET/PUT/DELETE /departments/:id |
| Designations | GET/POST /designations, GET/PUT/DELETE /designations/:id |
| Shifts | GET/POST /shifts, GET/PUT/DELETE /shifts/:id |
| Holidays | GET/POST /holidays, GET/PUT/DELETE /holidays/:id |
| Attendance | GET/POST /attendance, POST /attendance/bulk |
| Overtime | GET/POST /overtime-entries, GET/POST /overtime-rules |
| Payroll | GET/POST /payroll/runs, POST /payroll/runs/:id/finalize |
| Salary Slips | GET /salary-slips, GET /salary-slips/:id/pdf |
| Reports | GET /reports/employees, /reports/attendance, /reports/payroll |
| Settings | GET/PUT /settings |
| Audit Logs | GET /audit-logs |
| Notifications | GET /notifications, PATCH /notifications/:id/read |

## License

MIT