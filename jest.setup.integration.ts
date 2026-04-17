/**
 * Jest setup for integration tests only.
 * Does NOT mock fetch — integration tests fire real HTTP requests to the
 * running dev server and must use Node.js native fetch.
 */
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
