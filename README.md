# Artisan Roast: A Modern E-Commerce Coffee Store

Artisan Roast is a full-stack, theme-able e-commerce application built for specialty coffee retail. This project serves as a comprehensive portfolio piece, designed from the ground up to demonstrate mastery of modern web development practices, end-to-end type safety, and AI integration.

It features a minimal, high-quality product list and an AI-powered assistant to help customers find their perfect coffee, showcasing a blend of product-focused design and advanced technical implementation.

## Core Features

- **🛒 Shopping Cart:** Zustand-powered cart with localStorage persistence, supports one-time purchases and subscriptions
- **💳 Stripe Checkout:** Full payment integration with webhook processing for order fulfillment
- **🔐 Authentication:** Auth.js with OAuth (GitHub/Google) and database sessions
- **📦 Order Tracking:** Complete order history with status tracking and customer details
- **🎨 Theme-able UI:** Switch between Light and Dark modes (Tailwind CSS & CSS Variables)
- **📱 Fully Responsive:** Clean, mobile-first layout that scales to all devices
- **🤖 AI Coffee Helper:** Chat-based modal using Google Gemini API for personalized recommendations
- **⚡ Type-Safe:** End-to-end TypeScript with Prisma for database type safety
- **🚀 Production Ready:** Deployed on Vercel with PostgreSQL (Neon) backend

## Tech Stack & Skills Showcased

This project was built to demonstrate proficiency across the entire stack, as defined in the modern senior developer skill matrix.

### 1. Core Technical Skills

- **Framework:** **Next.js 14+** (App Router, Server-Side Rendering, and Serverless API Routes)

- **Language:** **TypeScript** (Strict mode, with end-to-end type safety from database to UI)

- **Styling:** **Tailwind CSS** (with a custom, theme-able design system built on CSS Variables)

- **Component Library:** **shadcn/ui** (for accessible, theme-able, and unstyled components)

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

- **Accessibility:** Adherence to **WCAG** standards (supported by shadcn/ui).

## Quick Start

Want to run this locally? See the **[📖 Complete Setup Guide](./SETUP.md)** for detailed instructions.

### TL;DR

```bash
# 1. Clone and install
git clone https://github.com/yuens1002/ecomm-ai-app.git
cd artisan-roast
npm install

# 2. Copy environment template
cp .env.example .env.local
# Edit .env.local with your credentials (see SETUP.md)

# 3. Set up database
npx prisma generate
npx prisma migrate deploy
npm run seed

# 4. Start development (requires 2 terminals)
npm run dev                                                    # Terminal 1
stripe listen --forward-to localhost:3000/api/webhooks/stripe # Terminal 2
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

**Important:** You'll need accounts for Neon (database), Stripe (payments), and OAuth providers (GitHub/Google). See [SETUP.md](./SETUP.md) for complete instructions.

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
