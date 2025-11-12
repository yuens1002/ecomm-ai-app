# Artisan Roast: A Modern E-Commerce Coffee Store

Artisan Roast is a full-stack, theme-able e-commerce application built for specialty coffee retail. This project serves as a comprehensive portfolio piece, designed from the ground up to demonstrate mastery of modern web development practices, end-to-end type safety, and AI integration.

It features a minimal, high-quality product list and an AI-powered assistant to help customers find their perfect coffee, showcasing a blend of product-focused design and advanced technical implementation.

## Core Features

- **Theme-able UI:** Switch between Light and Dark modes. (Implemented with Tailwind CSS & CSS Variables).

- **Fully Responsive Design:** A clean, mobile-first layout that scales to all devices.

- **AI Coffee Helper:** A chat-based modal that uses the Google Gemini API to ask users questions and provide personalized coffee recommendations.

- **Open-Source:** The project is fully open-source with a clear code structure and MIT License.

- **(In-Progress):** Full cart and checkout functionality.

## Tech Stack & Skills Showcased

This project was built to demonstrate proficiency across the entire stack, as defined in the modern senior developer skill matrix.

### 1. Core Technical Skills

- **Framework:** **Next.js 14+** (App Router, Server-Side Rendering, and Serverless API Routes)

- **Language:** **TypeScript** (Strict mode, with end-to-end type safety from database to UI)

- **Styling:** **Tailwind CSS** (with a custom, theme-able design system built on CSS Variables)

- **State Management:** React Hooks (`useState`, `useContext`) & **Zustand** (for lightweight global state)

### 2. Fullstack & Data Layer

- **Backend:** **Next.js API Routes** (as a serverless backend)

- **Database:** **PostgreSQL**

- **ORM:** **Prisma** (for type-safe database queries and migrations)

### 3. DevOps & Modern Practices

- **Containerization:** **Docker** & `docker-compose.yml` for a reproducible local development environment.

- **CI/CD:** **GitHub Actions** (configured to run tests and builds on every push).

### 4. Emerging Trends & AI

- **AI Integration:** Real-time, dynamic recommendations from the **Google Gemini API** (`gemini-2.5-flash-preview-09-2025:generateContent`).

### 5. Testing & Quality

- **Unit/Integration:** **Jest/Vitest** for testing critical business logic.

- **E2E:** **Playwright** for end-to-end testing of user flows (e.g., adding to cart, using the AI helper).

- **Accessibility:** Adherence to **WCAG** standards for all interactive components.

## Getting Started

### 1. Clone the Repository

`git clone https://github.com/YourUsername/your-repo-name.git cd your-repo-name`

### 2. Install Dependencies

`npm install`

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of the project and add your database URL and API key:

```
.env.local
DATABASE_URL="postgresql://user:password@localhost:5432/#our-db-name" GEMINI_API_KEY="YOUR_GOOGLE_AI_API_KEY"
```

### 4. Run the Database (via Docker)

This will start a PostgreSQL database in a Docker container.

`docker compose up -d`

### 5. Run Database Migrations

This will sync your Prisma schema with the running database.

`npx prisma migrate dev`

### 6. Run the Development Server

`npm run dev`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
