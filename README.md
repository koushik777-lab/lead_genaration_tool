# LeadForge Elite - MERN Stack

This project has been migrated from a pnpm monorepo with PostgreSQL to a standard npm MERN stack (MongoDB, Express, React, Node.js).

## Project Structure

- `server/`: Express backend with Mongoose/MongoDB.
- `client/`: React/Vite frontend.
- `package.json`: Root package.json using npm workspaces to manage both.

## Prerequisites

1.  **Node.js & npm** installed.
2.  **MongoDB** running locally (`mongodb://localhost:27017/`).
3.  **SerpApi Key** (Optional, for business search functionality).

## Getting Started

1.  **Install all dependencies:**
    ```bash
    npm install
    ```

2.  **Set up Environment Variables:**
    Create a `.env` file in the `server/` directory:
    ```env
    PORT=5001
    MONGODB_URI=mongodb://localhost:27017/leadforge
    SERPAPI_KEY=your_serpapi_key_here
    ```

3.  **Seed the Database (Optional but recommended):**
    Populate your local MongoDB with dummy leads, campaigns, and activities:
    ```bash
    npm run seed
    ```

4.  **Start Development Servers:**
    Run both server and client concurrently:
    ```bash
    npm run dev
    ```
    - Backend will run on: [http://localhost:5001](http://localhost:5001)
    - Frontend will run on: [http://localhost:5173](http://localhost:5173) (Proxies `/api` to port 5001)

## Key Migration Changes

- **Database:** Replaced Drizzle/PostgreSQL with Mongoose/MongoDB.
- **Models:** Created schemas for `Lead`, `Activity`, `Campaign`, `Template`, and `Note`.
- **API Client:** Replaced the workspace-linked API client with a clean `client/src/lib/api.ts` and `hooks.ts` using `@tanstack/react-query`.
- **Package Manager:** Switched from `pnpm` to standard `npm` with workspaces.
