import {
  describe,
  expect,
  it,
} from "vitest";
import {
  readRequestCookie,
} from "@/lib/auth/request-cookie";

describe("request cookie reader", () => {
  it("returns the requested cookie", () => {
    const request = new Request(
      "http://localhost:3000",
      {
        headers: {
          cookie:
            "theme=dark; mtii_staff_session=abc123; language=en",
        },
      }
    );

    expect(
      readRequestCookie(
        request,
        "mtii_staff_session"
      )
    ).toBe("abc123");
  });

  it("returns null when the cookie header is missing", () => {
    const request = new Request(
      "http://localhost:3000"
    );

    expect(
      readRequestCookie(
        request,
        "mtii_staff_session"
      )
    ).toBeNull();
  });

  it("returns null when the requested cookie is missing", () => {
    const request = new Request(
      "http://localhost:3000",
      {
        headers: {
          cookie:
            "theme=dark; language=en",
        },
      }
    );

    expect(
      readRequestCookie(
        request,
        "mtii_staff_session"
      )
    ).toBeNull();
  });

  it("decodes encoded cookie values", () => {
    const request = new Request(
      "http://localhost:3000",
      {
        headers: {
          cookie:
            "mtii_staff_session=hello%20world",
        },
      }
    );

    expect(
      readRequestCookie(
        request,
        "mtii_staff_session"
      )
    ).toBe("hello world");
  });

  it("preserves equals signs inside cookie values", () => {
    const request = new Request(
      "http://localhost:3000",
      {
        headers: {
          cookie:
            "mtii_staff_session=abc=123==",
        },
      }
    );

    expect(
      readRequestCookie(
        request,
        "mtii_staff_session"
      )
    ).toBe("abc=123==");
  });

  it("returns null for an empty cookie value", () => {
    const request = new Request(
      "http://localhost:3000",
      {
        headers: {
          cookie:
            "mtii_staff_session=",
        },
      }
    );

    expect(
      readRequestCookie(
        request,
        "mtii_staff_session"
      )
    ).toBeNull();
  });

  it("returns null for malformed encoded values", () => {
    const request = new Request(
      "http://localhost:3000",
      {
        headers: {
          cookie:
            "mtii_staff_session=%E0%A4%A",
        },
      }
    );

    expect(
      readRequestCookie(
        request,
        "mtii_staff_session"
      )
    ).toBeNull();
  });
});