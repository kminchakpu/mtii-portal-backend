export function readRequestCookie(
  request: Request,
  cookieName: string
): string | null {
  const cookieHeader =
    request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] =
      cookie.trim().split("=");

    if (name === cookieName) {
      const value = valueParts.join("=");

      if (!value) {
        return null;
      }

      try {
        return decodeURIComponent(value);
      } catch {
        return null;
      }
    }
  }

  return null;
}