# Artisan Roast: A Modern E-Commerce Coffee Store

🚀 **Live Demo:** [https://ecomm-ai-app.vercel.app/](https://ecomm-ai-app.vercel.app/)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyuens1002%2Fecomm-ai-app&env=DATABASE_URL,DIRECT_URL,AUTH_SECRET,STRIPE_SECRET_KEY,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,RESEND_API_KEY,RESEND_FROM_EMAIL,NEXT_PUBLIC_APP_URL&envDescription=Required%20environment%20variables%20for%20Artisan%20Roast.%20See%20.env.example%20for%20details.&envLink=https%3A%2F%2Fgithub.com%2Fyuens1002%2Fecomm-ai-app%2Fblob%2Fmain%2F.env.example&project-name=artisan-roast&repository-name=artisan-roast)

### Try the Demo

No signup required. Click the **"Sign in as Admin"** or **"Sign in as Demo Customer"** buttons on the [sign-in page](https://ecomm-ai-app.vercel.app/auth/signin) to explore instantly.

| Account | What You'll See |
|---------|-----------------|
| **Admin** | Full dashboard: products, orders, analytics, Menu Builder, Pages CMS |
| **Demo Customer** | Order history, active subscription, AI-powered recommendations |

> This is a shared demo environment. Please be respectful with the data.

---

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

- **AI Recommendations:** Behavioral product recommendations based on user activity (purchases, views, searches)
- **Personalized Context Injection:** Gemini-powered assistant with user context (order history, favorites, behavioral data)
- **Smart Scoring Algorithm:** +10 roast match, +5 per tasting note match, +3 viewed, -20 recent purchase
- **Homepage Recommendations:** Session-aware "Recommended For You" section with 6 personalized products
- **Trending Products:** Fallback recommendations for anonymous users based on view counts
- **Chat AI Assistant:** Text-based conversational interface with full order history context and brewing expertise *(In Progress)*
- **Voice AI Barista:** Multilingual voice assistant for hands-free coffee recommendations *(In Progress)*

### 📊 Admin Dashboard

- **Analytics & Insights:** Comprehensive analytics with trending products, top searches, conversion metrics
- **Behavioral Tracking:** 5 activity types (PAGE_VIEW, PRODUCT_VIEW, SEARCH, ADD_TO_CART, REMOVE_FROM_CART)
- **Session Tracking:** Supports both anonymous and authenticated users
- **Daily Activity Trends:** Visual bar charts showing activity patterns over 7/30 days

### 🍽️ Menu Builder (v0.72.0)

Complete admin tool for managing product menu hierarchy with labels and categories:

- **Multi-Select:** Shift+click range selection, checkbox bulk selection
- **Drag-and-Drop:** Reorder items with undo/redo support
- **Context Menus:** Bulk operations (clone, delete, move, visibility toggle)
- **Keyboard Shortcuts:** Delete, C (clone), V (toggle visibility), H (hide)
- **5 Table Views:** Menu overview, All Labels, All Categories, Label Detail, Category Detail
- **Mobile-Friendly:** 44x44px touch targets (WCAG 2.5.5 compliance)

### 📝 Pages CMS

AI-powered content management system for informational pages:

- **Rich Content Pages:** Create and manage pages with rich text content and hero images
- **AI-Powered Generation:** 10-question wizard that generates compelling About pages in your brand's voice
- **Hierarchical Structure:** Organize pages in parent-child relationships
- **Publishing Workflow:** Draft and publish with footer navigation integration

### 🎨 User Experience

- **Theme-able UI:** Switch between Light and Dark modes (Tailwind CSS & CSS Variables)
- **📱 Fully Responsive:** Clean, mobile-first layout that scales to all devices
- **⚡ Type-Safe:** End-to-end TypeScript with Prisma for database type safety
- **🚀 Production Ready:** Deployed on Vercel with PostgreSQL (Neon) backend

## Tech Stack & Skills Showcased

This project was built to demonstrate proficiency across the entire stack, as defined in the modern senior developer skill matrix.

### 1. Core Technical Skills

- **Framework:** **Next.js 16** (App Router, React 19, Server Components, Server Actions)

- **Language:** **TypeScript** (Strict mode, with end-to-end type safety from database to UI)

- **Styling:** **Tailwind CSS 4** (with a custom, theme-able design system built on CSS Variables)

- **Component Library:** **shadcn/ui** (for accessible, theme-able, and unstyled components)

- **State Management:** React Hooks (`useState`, `useContext`) & **Zustand** (for lightweight global state)

### 2. Fullstack & Data Layer

- **Backend:** **Next.js API Routes** & **Server Actions** (serverless backend)

- **Database:** **PostgreSQL** (Neon)

- **ORM:** **Prisma** (for type-safe database queries and migrations)

### 3. DevOps & Modern Practices

- **CI/CD:** **GitHub Actions** (configured to run tests and builds on every push)

- **Deployment:** **Vercel** (automatic deployments from main branch)

### 4. Emerging Trends & AI

- **AI Integration:** Real-time, dynamic recommendations from the **Google Gemini API** (`gemini-2.5-flash:generateContent`)

- **AI Content Generation:** Pages CMS with AI-powered About page wizard

### 5. Testing & Quality

- **Unit/Integration:** **Jest** with Testing Library for testing critical business logic (500+ tests)

- **Accessibility:** Adherence to **WCAG** standards (supported by shadcn/ui, 44px touch targets)

## Quick Start

### Option 1: One-Click Deploy (Easiest)

Click the button below to deploy your own instance to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyuens1002%2Fecomm-ai-app&env=DATABASE_URL,DIRECT_URL,AUTH_SECRET,STRIPE_SECRET_KEY,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,RESEND_API_KEY,RESEND_FROM_EMAIL,NEXT_PUBLIC_APP_URL&envDescription=Required%20environment%20variables%20for%20Artisan%20Roast.%20See%20.env.example%20for%20details.&envLink=https%3A%2F%2Fgithub.com%2Fyuens1002%2Fecomm-ai-app%2Fblob%2Fmain%2F.env.example&project-name=artisan-roast&repository-name=artisan-roast)

You'll need:
- [Neon](https://neon.tech) account (free tier available) for PostgreSQL database
- [Stripe](https://stripe.com) account for payment processing
- [Resend](https://resend.com) account (free tier: 3,000 emails/month) for transactional emails

### Option 2: Local Development

See the **[📖 Complete Setup Guide](./SETUP.md)** for detailed instructions, or follow the quick steps below:

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

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
