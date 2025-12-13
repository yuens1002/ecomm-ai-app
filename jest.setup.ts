import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Polyfill for Next.js edge runtime globals
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Ensure Request/Response are available even if mocks override fetch
const g = globalThis as typeof globalThis & {
  Request?: typeof Request;
  Response?: typeof Response;
  Headers?: typeof Headers;
};

if (!g.Request && typeof globalThis !== "undefined") {
  g.Request = globalThis.Request;
  g.Response = globalThis.Response;
  g.Headers = globalThis.Headers;
}

// Mock sessionStorage for tests when window exists (jsdom)
if (typeof window !== "undefined") {
  const sessionStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  Object.defineProperty(window, "sessionStorage", {
    value: sessionStorageMock,
  });

  // Mock matchMedia for embla carousel
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock IntersectionObserver for embla carousel
  global.IntersectionObserver = class IntersectionObserver {
    observe = jest.fn();
    disconnect = jest.fn();
    unobserve = jest.fn();
    takeRecords = jest.fn();
    root = null;
    rootMargin = "";
    thresholds = [];

    constructor() {}
  } as unknown as typeof IntersectionObserver;

  // Mock ResizeObserver for embla carousel
  global.ResizeObserver = class ResizeObserver {
    observe = jest.fn();
    disconnect = jest.fn();
    unobserve = jest.fn();

    constructor() {}
  } as unknown as typeof ResizeObserver;
}

// Mock fetch for API calls
global.fetch = jest.fn();
