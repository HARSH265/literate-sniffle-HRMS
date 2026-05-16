# Manufacturing HRMS

Production-grade HRMS for manufacturing companies built with MERN stack.

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Ant Design, TanStack Query, Zustand
- **Backend:** Express, TypeScript, MongoDB, Mongoose
- **Database:** MongoDB Atlas

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Cloudinary account (for file uploads)

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

5. Run the application

```bash
# Development (from root, needs concurrently or two terminals)
cd client && npm run dev
cd server && npm run dev
```

6. Seed the database

```bash
cd server && npm run seed
```

## Default Login

- **Email:** admin@hrms.com
- **Password:** admin123

## Project Structure

See `docs/architecture.md` for full project structure documentation.

## Documentation

All project documentation is in the `docs/` folder:
- PRD.md — Product requirements
- architecture.md — Architecture decisions
- schema.md — Database schema
- api-spec.md — API specification
- domain-rules.md — Business rules
- project-state.md — Current project status
- todo.md — Implementation checklist
- open-questions.md — Open questions and decisions
- decision-log.md — Technical decisions made
- performance-checklist.md — Performance practices