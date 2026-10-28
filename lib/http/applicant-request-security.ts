function isSafeMethod(
  method: string
): boolean {
  return (
    method === "GET" ||
    method === "HEAD" ||
    method === "OPTIONS"
  );
}

function isSameOrigin(
  request: Request,
  origin: string
): boolean {
  try {
    return (
      new URL(origin).origin ===
      new URL(request.url).origin
    );
  } catch {
    return false;
  }
}

export class ApplicantCrossSiteRequestError
  extends Error {
  constructor() {
    super(
      "Cross-site request forbidden."
    );

    this.name =
      "ApplicantCrossSiteRequestError";
  }
}

export function enforceApplicantRequestOrigin(
  request: Request
): void {
  if (
    isSafeMethod(
      request.method
    )
  ) {
    return;
  }

  const fetchSite =
    request.headers.get(
      "sec-fetch-site"
    );

  if (
    fetchSite === "cross-site"
  ) {
    throw new ApplicantCrossSiteRequestError();
  }

  const origin =
    request.headers.get(
      "origin"
    );

  if (
    origin &&
    !isSameOrigin(
      request,
      origin
    )
  ) {
    throw new ApplicantCrossSiteRequestError();
  }
}