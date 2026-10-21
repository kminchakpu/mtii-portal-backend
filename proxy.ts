import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  getSessionConfig,
} from "@/lib/auth/session-config";

const STAFF_LOGIN_PATH =
  "/staff/login";

function isStaffPath(
  pathname: string
): boolean {
  return (
    pathname === "/staff" ||
    pathname.startsWith(
      "/staff/"
    )
  );
}

function isStaffLoginPath(
  pathname: string
): boolean {
  return (
    pathname ===
    STAFF_LOGIN_PATH
  );
}

export function proxy(
  request: NextRequest
) {
  const { pathname } =
    request.nextUrl;

  if (!isStaffPath(pathname)) {
    return NextResponse.next();
  }

  if (
    isStaffLoginPath(pathname)
  ) {
    return NextResponse.next();
  }

  const { cookieName } =
    getSessionConfig();

  const sessionToken =
    request.cookies.get(
      cookieName
    )?.value;

  if (!sessionToken) {
    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname =
      STAFF_LOGIN_PATH;

    loginUrl.search = "";

    return NextResponse.redirect(
      loginUrl
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/staff/:path*",
  ],
};