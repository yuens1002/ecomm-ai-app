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

// Mock sessionStorage for tests
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

// Mock fetch for API calls
global.fetch = jest.fn();
