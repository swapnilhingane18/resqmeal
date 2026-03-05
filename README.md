# 🍲 ResQMeal

![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)

ResQMeal is a comprehensive, full-stack food rescue platform designed to optimize food donation and assignment to volunteer NGOs. Its core focus is an intelligent allocation engine running behind the scenes to smartly match available food with those in need.

## ✨ Features

- **NGO & Assignment Flow:** Streamlined process for assigning food pickup and delivery to NGOs.
- **Allocation Engine:** Smart matching between available food resources and nearby NGOs.
- **Live Volunteer Location Screening:** Real-time tracking and location visualization using interactive maps.
- **Secure Authentication:** JWT-based secure login and stateful user management.
- **Robust Database Connectivity:** Built-in DB retry logic, supporting both local MongoDB Replica Sets and MongoDB Atlas.

## 🛠️ Technology Stack

**Frontend Framework:**
- React 19 + Vite
- React Router DOM
- Zustand (State Management)
- Tailwind CSS v4 + PostCSS (Styling)
- React Leaflet (Mapping & Geolocation)
- Recharts (Data Visualization)
- React Hook Form + Zod (Validation)

**Backend Framework:**
- Node.js + Express
- MongoDB + Mongoose
- JSON Web Tokens (JWT) & bcryptjs
- node-cron (Scheduled Tasks)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local Replica Set needed for transactions, or a MongoDB Atlas account)
  - *Note:* If using MongoDB Atlas, ensure your current IP address is whitelisted in your cluster's Network Access panel.

## ⚙️ Environment Configuration

Create a `.env` file in the root directory by copying the example file:

```bash
cp .env.example .env
```

Ensure your `.env` contains the required database connection string:
- `MONGO_URI`: Your MongoDB connection URI.

## 🚀 Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/swapnilhingane18/resqmeal.git
   cd resqmeal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## 🏃‍♂️ Running the Application

### Development Servers

To start the backend server:
```bash
npm run server
```

In a separate terminal, start the Vite frontend development server:
```bash
npm run dev
```

*(Note: Verify your MongoDB instance is running and accessible via the `MONGO_URI` before starting the backend).*

### Running Utilities
You can seed the database with demo data or run tests using:
```bash
npm run demo
```

## 🗂️ Project Structure

- `src/` - React frontend application (Components, Pages, Hooks, Config)
- `public/` - Static frontend assets
- `controllers/`, `routes/`, `models/` - Express backend architecture
- `services/` - Core business logic and the allocation engine
- `middleware/` - Express middlewares (Authentication, Validation)
- `scripts/` - Utility scripts for database verification and seeding
- `config/` - Configuration files including database connections

## 🔍 API Health Check

Verify your backend and database connection status using the health endpoint:

**Endpoint:**
`GET /health`

**Example Response:**
```json
{
  "status": "OK",
  "dbState": "connected",
  "envValidated": true
}
```

## 📄 License

ISC License
