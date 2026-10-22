const SAFE_METHODS = new Set([
  "GET",
  "HEAD",
  "OPTIONS",
]);

function isSafeMethod(
  method: string
): boolean {
  return SAFE_METHODS.has(
    method.toUpperCase()
  );
}

function hasCrossSiteFetchMetadata(
  request: Request
): boolean {
  return (
    request.headers.get(
      "sec-fetch-site"
    ) === "cross-site"
  );
}

function isSameOrigin(
  request: Request,
  origin: string
): boolean {
  try {
    const requestUrl = new URL(
      request.url
    );
    const originUrl = new URL(
      origin
    );

    return (
      originUrl.origin ===
      requestUrl.origin
    );
  } catch {
    return false;
  }
}

export function isStaffRequestOriginAllowed(
  request: Request
): boolean {
  if (isSafeMethod(request.method)) {
    return true;
  }

  if (
    hasCrossSiteFetchMetadata(
      request
    )
  ) {
    return false;
  }

  const origin =
    request.headers.get("origin");

  if (origin) {
    return isSameOrigin(
      request,
      origin
    );
  }

  return true;
}