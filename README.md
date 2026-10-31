# Nadar TMS

Nadar TMS is a full-stack transport management system built for managing school and fleet operations across multiple roles, including administrators, in-charges, drivers, and parents.

The project includes a React frontend for the operations dashboard and an Express + MySQL backend for APIs, authentication, route planning, attendance, maintenance, reporting, and live tracking.

## Overview

This repository contains a web application and backend service designed for:

- Fleet and bus management
- Driver and student administration
- Route and stop planning
- Trip assignments and attendance tracking
- Maintenance and tyre inventory management
- Reports, alerts, and diesel tracking
- GPS-based live tracking and telemetry support
- Role-based access for different user types

## Tech Stack

### Frontend
- React
- Vite
- React Router
- MapLibre GL
- jsPDF / jsPDF AutoTable
- jsZip
- Lucide React

### Backend
- Node.js
- Express
- MySQL
- JWT authentication
- bcryptjs
- CORS and dotenv

## Project Structure

```text
.
├── README.md
├── .gitignore
└── nadar-tms/
    ├── client/
    │   ├── public/
    │   ├── src/
    │   ├── index.html
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── vite.config.js
    │   └── .gitignore
    └── server/
        ├── controllers/
        ├── db/
        ├── middleware/
        ├── routes/
        ├── services/
        ├── package.json
        ├── server.js
        ├── compiled_theni_routes.json
        └── routes_stops_dump.json
```

## Main Features

### Admin / Executive Features
- Dashboard overview
- Institution management
- Bus, driver, and spare-part management
- Student records and route assignments
- Attendance and reports
- Maintenance and job cards
- Diesel usage monitoring
- Fleet alerts
- Live tracking map

### Role-Based Access
- Admin / Executive / Institution
- Incharge
- Driver
- Parent

### Operational Modules
- Route and stop management
- Driver salary tracking
- Maintenance inventory and tyre management
- GPS architecture explainer and telemetry support
- Exportable PDF and ZIP-related reporting utilities

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MySQL database
- A configured `.env` file for the backend

### 1) Install backend dependencies

```bash
cd nadar-tms/server
npm install
```

### 2) Configure environment variables

Create a `.env` file in `nadar-tms/server` with values similar to:

```env
PORT=5001
GPS_PORT=5050
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=nadar_tms2
DB_USER=root
DB_PASSWORD=
JWT_SECRET=your_jwt_secret_here
```

### 3) Start the backend

```bash
cd nadar-tms/server
npm run dev
```

The API will be available at:

- http://localhost:5001/api/health

### 4) Install frontend dependencies

```bash
cd nadar-tms/client
npm install
```

### 5) Start the frontend

```bash
cd nadar-tms/client
npm run dev
```

The frontend runs by default at:

- http://localhost:5173

### 6) Database setup

If the schema is not already present in MySQL, initialize it with the project database SQL scripts as needed.

```bash
cd nadar-tms/server
mysql -u root -p < db/schema.sql
```

## Runtime Notes

The backend includes startup checks that create or adjust key database columns if they are missing, and it also starts a GPS TCP telemetry listener on the configured GPS port.

The root route on the backend redirects users to the frontend UI at the local Vite app URL.

## Typical User Roles

- Administrator: overall system management
- Institution: institution-level operations and oversight
- Incharge: attendance and operational monitoring
- Driver: trip and fuel activity logging
- Parent: route and live tracking access

## Notes

This repository is a transport management solution focused on day-to-day school transport operations, fleet coordination, and monitoring with a role-based interface.

For local development, run both the backend and frontend services simultaneously.

## Repository Summary

- Frontend: React + Vite app in `nadar-tms/client`
- Backend: Express + MySQL API in `nadar-tms/server`
- Purpose: end-to-end transport management for buses, drivers, routes, students, maintenance, and GPS tracking
