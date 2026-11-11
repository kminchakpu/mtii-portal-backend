import {
  headers,
} from "next/headers";

import {
  getAppUrl,
} from "@/lib/config/app-url";

function validateApplicantPath(
  pathname: string
): void {
  const isApplicantPath =
    pathname === "/applicant" ||
    pathname.startsWith(
      "/applicant/"
    );

  if (!isApplicantPath) {
    throw new Error(
      "Applicant server requests must use an /applicant path."
    );
  }
}

export async function createApplicantServerRequest(
  pathname: string
): Promise<Request> {
  validateApplicantPath(
    pathname
  );

  const requestHeaders =
    await headers();

  const url =
    new URL(
      pathname,
      getAppUrl()
    );

  return new Request(
    url,
    {
      method: "GET",
      headers:
        new Headers(
          requestHeaders
        ),
    }
  );
}