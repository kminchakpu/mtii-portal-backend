import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type {
  AuthorizationContext,
} from "@/lib/rbac/authorization";
import {
  ForbiddenError,
  UnauthenticatedError,
} from "@/lib/rbac/errors";

const mocks = vi.hoisted(() => ({
  getRequestAuthorization:
    vi.fn(),
  listStaffRoles:
    vi.fn(),
}));

vi.mock(
  "@/lib/rbac/request-authorization",
  () => ({
    getRequestAuthorization:
      mocks.getRequestAuthorization,
  })
);

vi.mock(
  "@/lib/staff/staff-role-repository",
  () => ({
    listStaffRoles:
      mocks.listStaffRoles,
  })
);

import {
  GET,
} from "@/app/api/staff/roles/route";

const authorization:
  AuthorizationContext = {
    userId: 1,
    publicId:
      "staff-public-id",
    departmentId: 2,
    departmentCode: "TRADE",
    roles: [
      "DEPARTMENT_ADMIN",
    ],
    permissions: [
      "ROLE_VIEW",
    ],
  };

const roles = [
  {
    id: 1,
    publicId:
      "11111111-1111-4111-8111-111111111111",
    code: "DIRECTOR",
    name: "Director",
    description:
      "Director role.",
    isActive: true,
    createdAt:
      new Date(
        "2026-10-01T09:00:00.000Z"
      ),
    updatedAt:
      new Date(
        "2026-10-01T09:00:00.000Z"
      ),
  },
  {
    id: 2,
    publicId:
      "22222222-2222-4222-8222-222222222222",
    code:
      "REVIEW_OFFICER",
    name:
      "Review Officer",
    description:
      "Reviews applications.",
    isActive: false,
    createdAt:
      new Date(
        "2026-10-01T10:00:00.000Z"
      ),
    updatedAt:
      new Date(
        "2026-10-02T10:00:00.000Z"
      ),
  },
];

function createRequest() {
  return new Request(
    "http://localhost/api/staff/roles"
  );
}

describe(
  "GET /api/staff/roles",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.getRequestAuthorization
        .mockResolvedValue(
          authorization
        );

      mocks.listStaffRoles
        .mockResolvedValue(
          roles
        );
    });

    it("returns staff roles for staff with ROLE_VIEW permission", async () => {
      const response =
        await GET(
          createRequest()
        );

      expect(
        response.status
      ).toBe(200);

      const body =
        await response.json();

      expect(body).toEqual({
        roles: [
          {
            publicId:
              "11111111-1111-4111-8111-111111111111",
            code:
              "DIRECTOR",
            name:
              "Director",
            description:
              "Director role.",
            isActive: true,
            createdAt:
              "2026-10-01T09:00:00.000Z",
            updatedAt:
              "2026-10-01T09:00:00.000Z",
          },
          {
            publicId:
              "22222222-2222-4222-8222-222222222222",
            code:
              "REVIEW_OFFICER",
            name:
              "Review Officer",
            description:
              "Reviews applications.",
            isActive: false,
            createdAt:
              "2026-10-01T10:00:00.000Z",
            updatedAt:
              "2026-10-02T10:00:00.000Z",
          },
        ],
      });

      expect(
        mocks.listStaffRoles
      ).toHaveBeenCalledTimes(1);
    });

    it("does not expose internal role IDs", async () => {
      const response =
        await GET(
          createRequest()
        );

      const body =
        await response.json();

      expect(
        body.roles[0]
      ).not.toHaveProperty(
        "id"
      );

      expect(
        body.roles[1]
      ).not.toHaveProperty(
        "id"
      );
    });

    it("includes inactive roles for administrative inspection", async () => {
      const response =
        await GET(
          createRequest()
        );

      const body =
        await response.json();

      expect(
        body.roles[1].isActive
      ).toBe(false);
    });

    it("returns 401 when the request is unauthenticated", async () => {
      mocks.getRequestAuthorization
        .mockRejectedValue(
          new UnauthenticatedError()
        );

      const response =
        await GET(
          createRequest()
        );

      expect(
        response.status
      ).toBe(401);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Unauthenticated.",
      });

      expect(
        mocks.listStaffRoles
      ).not.toHaveBeenCalled();
    });

    it("returns 403 when staff lacks ROLE_VIEW permission", async () => {
      mocks.getRequestAuthorization
        .mockResolvedValue({
          ...authorization,
          permissions: [],
        });

      const response =
        await GET(
          createRequest()
        );

      expect(
        response.status
      ).toBe(403);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Forbidden.",
      });

      expect(
        mocks.listStaffRoles
      ).not.toHaveBeenCalled();
    });

    it("returns 403 when authorization rejects the request", async () => {
      mocks.getRequestAuthorization
        .mockRejectedValue(
          new ForbiddenError()
        );

      const response =
        await GET(
          createRequest()
        );

      expect(
        response.status
      ).toBe(403);

      await expect(
        response.json()
      ).resolves.toEqual({
        error:
          "Forbidden.",
      });

      expect(
        mocks.listStaffRoles
      ).not.toHaveBeenCalled();
    });

    it("rethrows unexpected repository errors", async () => {
      const unexpectedError =
        new Error(
          "Database unavailable."
        );

      mocks.listStaffRoles
        .mockRejectedValue(
          unexpectedError
        );

      await expect(
        GET(
          createRequest()
        )
      ).rejects.toBe(
        unexpectedError
      );
    });
  }
);