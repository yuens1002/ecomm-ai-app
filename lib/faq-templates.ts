/**
 * FAQ Template Data
 * Pre-written Q&As organized by category for shop owners to use as a starting point.
 * These can be imported into the FAQ page via seed or admin interface.
 */

import { FAQ_CATEGORIES } from "./blocks/schemas";

export interface FaqTemplate {
  question: string;
  answer: string;
  category: (typeof FAQ_CATEGORIES)[number]["id"];
}

export const FAQ_TEMPLATES: FaqTemplate[] = [
  // ===== GENERAL =====
  {
    category: "general",
    question: "What makes your coffee special?",
    answer:
      "We source our beans directly from small-batch farmers around the world, ensuring fair trade practices and exceptional quality. Each batch is roasted in small quantities to bring out the unique flavor profiles of each origin.",
  },
  {
    category: "general",
    question: "Do you offer coffee subscriptions?",
    answer:
      "Yes! We offer flexible subscription plans that deliver fresh-roasted coffee to your door on a schedule that works for you. You can choose weekly, bi-weekly, or monthly deliveries, and easily pause, skip, or cancel anytime.",
  },
  {
    category: "general",
    question: "Where are you located?",
    answer:
      "Our roastery and café are located in [Your City]. We welcome visitors during business hours to experience our coffee firsthand. Check our Contact page for our full address and hours.",
  },
  {
    category: "general",
    question: "Do you offer wholesale or bulk pricing?",
    answer:
      "Yes, we work with cafés, restaurants, and offices. Please contact us through our wholesale inquiry form for pricing and minimum order requirements.",
  },

  // ===== ORDERS =====
  {
    category: "orders",
    question: "How do I place an order?",
    answer:
      "Simply browse our products, add items to your cart, and proceed to checkout. You can check out as a guest or create an account to track your orders and earn rewards.",
  },
  {
    category: "orders",
    question: "Can I modify or cancel my order?",
    answer:
      "We begin processing orders quickly! If you need to modify or cancel, please contact us immediately. Once an order has shipped, it cannot be changed, but you may be able to return it after delivery.",
  },
  {
    category: "orders",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express, Discover), as well as Apple Pay, Google Pay, and Shop Pay for a faster checkout experience.",
  },
  {
    category: "orders",
    question: "Do you offer gift cards?",
    answer:
      "Yes! Digital gift cards are available in various denominations and are delivered instantly via email. They never expire and can be used on any products in our store.",
  },
  {
    category: "orders",
    question: "How do I track my order?",
    answer:
      "Once your order ships, you'll receive an email with tracking information. You can also log into your account to view order status and tracking details at any time.",
  },

  // ===== SHIPPING =====
  {
    category: "shipping",
    question: "How long does shipping take?",
    answer:
      "Standard shipping typically takes 3-5 business days within the continental US. Expedited shipping options are available at checkout for faster delivery.",
  },
  {
    category: "shipping",
    question: "Do you ship internationally?",
    answer:
      "Currently, we ship within the United States only. We're working on expanding our shipping options—sign up for our newsletter to be notified when international shipping becomes available.",
  },
  {
    category: "shipping",
    question: "How much does shipping cost?",
    answer:
      "Shipping rates are calculated at checkout based on your location and order weight. We offer free standard shipping on orders over $50!",
  },
  {
    category: "shipping",
    question: "Do you offer local pickup?",
    answer:
      "Yes! You can select local pickup at checkout if you're in our area. We'll notify you when your order is ready for pickup at our roastery.",
  },
  {
    category: "shipping",
    question: "What if my package is lost or damaged?",
    answer:
      "Contact us right away! We'll work with the carrier to locate your package or file a claim. In most cases, we can ship a replacement or issue a refund.",
  },

  // ===== RETURNS =====
  {
    category: "returns",
    question: "What is your return policy?",
    answer:
      "We want you to love your coffee! If you're not satisfied, contact us within 30 days of delivery. We'll make it right with an exchange, store credit, or refund.",
  },
  {
    category: "returns",
    question: "Can I return opened coffee?",
    answer:
      "Yes—we stand behind our products. If you're not satisfied with the taste, reach out and we'll work with you to find a coffee you'll love or provide a refund.",
  },
  {
    category: "returns",
    question: "How do I start a return?",
    answer:
      "Contact our support team through the Contact page or email us. We'll provide instructions and, if needed, a prepaid return label. Refunds are typically processed within 5-7 business days after we receive the return.",
  },
  {
    category: "returns",
    question: "Are subscriptions refundable?",
    answer:
      "Subscription shipments follow our standard return policy. You can also pause or cancel your subscription anytime from your account page—no questions asked.",
  },

  // ===== PRODUCTS =====
  {
    category: "products",
    question: "How should I store my coffee?",
    answer:
      "Store your coffee in a cool, dark place in an airtight container. Avoid the refrigerator or freezer, as moisture can affect the flavor. For best taste, use within 2-4 weeks of the roast date.",
  },
  {
    category: "products",
    question: "What grind sizes do you offer?",
    answer:
      "We offer whole bean (recommended for freshness), coarse (French press), medium (drip/pour-over), and fine (espresso). Select your preferred grind at checkout.",
  },
  {
    category: "products",
    question: "Do you have decaf options?",
    answer:
      "Yes! We offer Swiss Water Process decaf that maintains great flavor with 99.9% of caffeine removed. Check our product listings for current decaf offerings.",
  },
  {
    category: "products",
    question: "Are your coffees organic or fair trade?",
    answer:
      "Many of our coffees are certified organic and fair trade. Look for the certification badges on individual product pages. We prioritize ethical sourcing across all our beans.",
  },
  {
    category: "products",
    question: "What roast levels do you offer?",
    answer:
      "We roast from light to dark. Light roasts highlight origin flavors, medium roasts balance brightness and body, and dark roasts offer bold, rich flavors. Product pages describe each coffee's roast level.",
  },
  {
    category: "products",
    question: "Do you sell brewing equipment?",
    answer:
      "Yes! We carry a curated selection of brewing equipment including pour-over setups, French presses, grinders, and accessories. Check our Products page for current offerings.",
  },

  // ===== ACCOUNT =====
  {
    category: "account",
    question: "How do I create an account?",
    answer:
      "Click 'Sign In' at the top of the page and select 'Create Account.' You can also create an account during checkout. An account lets you track orders, manage subscriptions, and save favorites.",
  },
  {
    category: "account",
    question: "I forgot my password. How do I reset it?",
    answer:
      "Click 'Sign In,' then 'Forgot Password.' Enter your email address and we'll send you a link to reset your password. Check your spam folder if you don't see the email.",
  },
  {
    category: "account",
    question: "How do I manage my subscription?",
    answer:
      "Log into your account and go to the Subscriptions section. From there, you can change frequency, update products, skip shipments, or cancel anytime.",
  },
  {
    category: "account",
    question: "How do I update my shipping address?",
    answer:
      "Log into your account and go to your profile settings to update your default shipping address. You can also enter a different address during checkout.",
  },
  {
    category: "account",
    question: "Do you have a loyalty or rewards program?",
    answer:
      "We're working on a rewards program! Sign up for our newsletter and create an account to be the first to know when it launches.",
  },
];

/**
 * Get templates filtered by category
 */
export function getTemplatesByCategory(categoryId: string): FaqTemplate[] {
  return FAQ_TEMPLATES.filter((t) => t.category === categoryId);
}

/**
 * Get all unique categories that have templates
 */
export function getTemplateCategories(): string[] {
  return [...new Set(FAQ_TEMPLATES.map((t) => t.category))];
}
