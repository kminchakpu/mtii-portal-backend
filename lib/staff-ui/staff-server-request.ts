import {
  headers,
} from "next/headers";
import {
  getAppUrl,
} from "@/lib/config/app-url";

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