# Launch Post Drafts

## Product Hunt

### Title (max 60 chars)
```
Artisan Roast - Open-source e-commerce for coffee roasters
```

### Tagline (max 60 chars)
```
AI-powered store platform built by a roaster, for roasters
```

### Description (max 500 chars)
```
Artisan Roast is a free, open-source e-commerce platform designed specifically for specialty coffee.

Unlike generic platforms, it understands coffee. Customers can ask the AI "What's good for cold brew?" and get real recommendations. Subscriptions are built-in with Stripe. The drag-and-drop Menu Builder lets you organize by origin, roast level, or however you think about your beans.

Self-host for free (MIT license) or join our hosted waitlist.

Built with Next.js, TypeScript, and Prisma.
```

### Maker's First Comment
```
Hey PH! 👋

I built Artisan Roast because I was frustrated setting up stores for local roasters. Shopify charges monthly fees and doesn't understand coffee. WooCommerce needs 47 plugins. Building custom is expensive.

So I built what I wished existed:
- AI that actually speaks coffee ("bright and citrusy" → recommendations)
- Subscriptions that just work (Stripe handles everything)
- Menu Builder to organize your catalog visually
- 100% open source (MIT) - self-host free forever

The whole thing is Next.js 16 + TypeScript + Prisma + Tailwind. Type-safe from database to UI.

Try the live demo: https://ecomm-ai-app.vercel.app/
(Click the chat bubble and ask for coffee recommendations!)

I'd love feedback from:
- Coffee roasters thinking about their online store
- Developers who want to contribute
- Anyone who's struggled with e-commerce platforms

What features would make this more useful for you?
```

### Topics/Tags
- Open Source
- E-Commerce
- Artificial Intelligence
- SaaS
- Coffee

---

## Reddit: r/selfhosted

### Title
```
I built an open-source Shopify alternative for coffee shops - self-host on Vercel/Railway for free
```

### Post
```
Hey r/selfhosted!

I've been building an open-source e-commerce platform specifically for specialty coffee retailers. It's called Artisan Roast.

**Why another e-commerce platform?**

Generic platforms don't understand coffee. Customers want to browse by origin, roast level, tasting notes. They want to ask "what's similar to Ethiopian Yirgacheffe?" and get a real answer. I couldn't find anything that did this well, so I built it.

**What's included:**

- Full storefront with product catalog
- AI chat assistant (Google Gemini) that understands coffee
- AI-powered product recommendations based on browsing history
- Stripe checkout + subscription management
- Admin dashboard with analytics
- Drag-and-drop Menu Builder for catalog organization
- OAuth login (Google, GitHub)

**Tech stack:**

- Next.js 16 (App Router)
- TypeScript (strict mode, end-to-end type safety)
- PostgreSQL (works great with Neon's free tier)
- Prisma ORM
- Tailwind CSS + shadcn/ui
- Stripe for payments

**Self-hosting:**

Runs perfectly on Vercel's free tier. Also works on Railway, Render, or any Node.js host. PostgreSQL can be Neon (free), Supabase, or your own instance.

**Links:**

- Live demo: https://ecomm-ai-app.vercel.app/
- GitHub: https://github.com/yuens1002/ecomm-ai-app
- Setup guide: https://github.com/yuens1002/ecomm-ai-app/blob/main/SETUP.md

MIT licensed. No telemetry, no tracking, your data stays yours.

Would love feedback from the community. What features would you want to see? Anyone interested in contributing?
```

---

## Hacker News: Show HN

### Title
```
Show HN: Artisan Roast – Open-source e-commerce for specialty coffee (Next.js)
```

### Post
```
https://github.com/yuens1002/ecomm-ai-app

I built an open-source e-commerce platform specifically for specialty coffee retailers.

The interesting technical bits:

1. **AI that understands domain context** - The Gemini-powered chat assistant has product catalog context injected, so "bright and citrusy" maps to actual products. Recommendations factor in purchase history, browsing behavior, and roast preferences.

2. **Subscription complexity handled by Stripe** - Instead of building subscription logic, I leaned heavily on Stripe Billing Portal. Customers manage their own subscriptions (pause, skip, cancel) without admin intervention.

3. **Menu Builder** - A three-level hierarchy (Labels → Categories → Products) with drag-and-drop reordering. Same product can appear in multiple categories with independent ordering. Built with native HTML5 DnD (no library).

4. **Type safety end-to-end** - TypeScript strict mode + Prisma means the compiler catches most bugs. Server actions with Zod validation. No `any` types.

Tech: Next.js 16 (App Router), React 19, TypeScript, PostgreSQL/Prisma, Tailwind/shadcn, Stripe, Google Gemini.

Live demo: https://ecomm-ai-app.vercel.app/ (try the AI chat)

What I learned:
- Optimistic updates with SWR make the UI feel instant
- Stripe's webhook reliability is excellent; build idempotent handlers
- shadcn/ui components are worth the setup cost
- The hardest part was the Menu Builder state management (undo/redo across hierarchical data)

Looking for feedback on architecture decisions and any features that would make this more useful.
```

---

## Twitter/X Thread

### Tweet 1 (Hook)
```
I built an open-source Shopify alternative for coffee roasters.

It has an AI that actually understands coffee.

Here's the story 🧵
```

### Tweet 2 (Problem)
```
Local roasters kept asking me to help with their online stores.

Shopify: $29/mo + transaction fees + doesn't get coffee
WooCommerce: Plugin hell
Custom: $$$

I thought: what if I just... built the thing?
```

### Tweet 3 (Solution)
```
Artisan Roast:
- AI chat that knows coffee ("bright and citrusy" → real recs)
- Subscriptions built-in (Stripe handles it all)
- Menu Builder (drag-drop your catalog)
- Self-host free (MIT license)

Demo: https://ecomm-ai-app.vercel.app/
```

### Tweet 4 (Tech)
```
Built with:
- Next.js 16 + React 19
- TypeScript (strict, no any)
- Prisma + PostgreSQL
- Stripe Checkout + Billing Portal
- Google Gemini for AI
- Tailwind + shadcn/ui

The whole thing is type-safe from DB to UI.
```

### Tweet 5 (CTA)
```
It's 100% open source.

GitHub: https://github.com/yuens1002/ecomm-ai-app

If you're a roaster (or know one), I'd love feedback.

What features would make this actually useful for your business?
```

---

## LinkedIn Post

```
I just open-sourced an e-commerce platform I've been building for specialty coffee roasters.

It's called Artisan Roast, and it solves a problem I kept running into: generic e-commerce platforms don't understand coffee.

Customers don't just want "a bag of coffee." They want to browse by origin, ask "what's good for pour-over?", and get recommendations based on their taste preferences.

So I built a platform with:
→ AI assistant that understands coffee terminology
→ Subscription management (powered by Stripe)
→ Drag-and-drop menu organization
→ Beautiful admin dashboard

The tech stack is modern: Next.js 16, TypeScript, Prisma, Tailwind. Type-safe from database to UI.

And it's MIT licensed. Self-host for free on Vercel, Railway, or your own infrastructure.

Live demo: https://ecomm-ai-app.vercel.app/
GitHub: https://github.com/yuens1002/ecomm-ai-app

If you know any coffee roasters struggling with their online presence, I'd love to hear what features would help them most.

#opensource #ecommerce #nextjs #coffee #webdevelopment
```
