/**
 * Safely extract an error message from unknown error types
 * Handles Error instances, strings, and objects with message properties
 */
export const getErrorMessage = (error: unknown, fallback = "An unknown error occurred"): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }

  // Handle cases where the error is a plain object with a message property
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return fallback;
};
