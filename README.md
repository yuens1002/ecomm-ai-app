# Artisan Roast: A Modern E-Commerce Coffee Store

🚀 **Live Demo:** [https://ecomm-ai-app.vercel.app/](https://ecomm-ai-app.vercel.app/)

Artisan Roast is a full-stack, theme-able e-commerce application built for specialty coffee retail. This project serves as a comprehensive portfolio piece, designed from the ground up to demonstrate mastery of modern web development practices, end-to-end type safety, and AI integration.

It features a minimal, high-quality product list and an AI-powered assistant to help customers find their perfect coffee, showcasing a blend of product-focused design and advanced technical implementation.

## Core Features

### 🛍️ E-Commerce Essentials

- **🛒 Shopping Cart:** Zustand-powered cart with localStorage persistence, supports one-time purchases and subscriptions
- **💳 Stripe Checkout:** Full payment integration with webhook processing for order fulfillment
- **🔐 Authentication:** Auth.js with OAuth (GitHub/Google) and database sessions
- **📦 Order Tracking:** Complete order history with status tracking and customer details
- **🔄 Subscription Management:** Recurring orders with Stripe Billing Portal integration
- **🔍 Product Search:** Full-text search with activity tracking across name, description, origin, and tasting notes

### 🤖 AI-Powered Personalization

- **Chat AI Assistant (In Progress):** Text-based conversational interface with full order history context and brewing expertise
- **Voice AI Barista (In Progress):** Multilingual voice assistant for hands-free coffee recommendations and ordering
- **AI Recommendations:** Behavioral product recommendations based on user activity (purchases, views, searches)
- **Personalized Context Injection:** Gemini-powered assistant with user context (order history, favorites, behavioral data)
- **Smart Scoring Algorithm:** +10 roast match, +5 per tasting note match, +3 viewed, -20 recent purchase
- **Homepage Recommendations:** Session-aware "Recommended For You" section with 6 personalized products
- **Trending Products:** Fallback recommendations for anonymous users based on view counts

### 📊 Analytics & Insights

- **Admin Dashboard:** Comprehensive analytics with trending products, top searches, conversion metrics
- **Inventory Management (In Progress):** Real-time stock tracking, low stock alerts, and automated reordering
- **Behavioral Tracking:** 5 activity types (PAGE_VIEW, PRODUCT_VIEW, SEARCH, ADD_TO_CART, REMOVE_FROM_CART)
- **Session Tracking:** Supports both anonymous and authenticated users
- **Daily Activity Trends:** Visual bar charts showing activity patterns over 7/30 days

### 🎨 User Experience

- **Theme-able UI:** Switch between Light and Dark modes (Tailwind CSS & CSS Variables)
- **📱 Fully Responsive:** Clean, mobile-first layout that scales to all devices
- **⚡ Type-Safe:** End-to-end TypeScript with Prisma for database type safety
- **🚀 Production Ready:** Deployed on Vercel with PostgreSQL (Neon) backend

> **Want to see the AI recommendations in action?** Contact me for demo account credentials to experience personalized product recommendations, behavioral analytics, and the full feature set.

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

- **Containerization (Planned):** **Docker** & `docker-compose.yml` for a reproducible local development environment.

- **CI/CD:** **GitHub Actions** (configured to run tests and builds on every push).

### 4. Emerging Trends & AI

- **AI Integration:** Real-time, dynamic recommendations from the **Google Gemini API** (`gemini-2.5-flash:generateContent`).

### 5. Testing & Quality

- **Unit/Integration:** **Jest/Vitest** for testing critical business logic.

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
