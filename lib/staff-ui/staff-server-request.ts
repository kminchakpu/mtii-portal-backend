import {
  headers,
} from "next/headers";

const DEFAULT_APP_URL =
  "http://localhost:3000";

function getAppUrl(): string {
  const configuredUrl =
    process.env.APP_URL?.trim();

  if (!configuredUrl) {
    return DEFAULT_APP_URL;
  }

  return configuredUrl.replace(
    /\/+$/,
    ""
  );
}

function validateStaffPath(
  pathname: string
): void {
  const isStaffPath =
    pathname === "/staff" ||
    pathname.startsWith(
      "/staff/"
    );

  if (!isStaffPath) {
    throw new Error(
      "Staff server requests must use a /staff path."
    );
  }
}

export async function createStaffServerRequest(
  pathname: string
): Promise<Request> {
  validateStaffPath(pathname);

  const requestHeaders =
    await headers();

  const url = new URL(
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