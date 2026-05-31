import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function toApiError(code: string, message: string): Response {
  return Response.json(
    {
      error: {
        code,
        message
      }
    },
    { status: mapErrorCodeToStatus(code) }
  );
}

function mapErrorCodeToStatus(code: string): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "LIMIT_REACHED":
      return 429;
    case "BAD_REQUEST":
      return 400;
    default:
      return 500;
  }
}

export function sanitizeDocxValue(value: string): string {
  return value.replace(/[\u0000-\u001f]/g, " ").trim();
}
