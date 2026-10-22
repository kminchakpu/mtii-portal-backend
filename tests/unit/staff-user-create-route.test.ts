import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  ForbiddenError,
  UnauthenticatedError,
} from "@/lib/rbac/errors";
import {
  StaffEmailConflictError,
} from "@/lib/staff/errors";

const {
  getRequestAuthorization,
  createStaffAccount,
  listStaffUsers,
  listStaffUsersByDepartment,
} = vi.hoisted(() => ({
  getRequestAuthorization:
    vi.fn(),
  createStaffAccount:
    vi.fn(),
  listStaffUsers:
    vi.fn(),
  listStaffUsersByDepartment:
    vi.fn(),
}));

vi.mock(
  "@/lib/rbac/request-authorization",
  () => ({
    getRequestAuthorization,
  })
);

vi.mock(
  "@/lib/staff/staff-user-service",
  () => ({
    createStaffAccount,
  })
);

vi.mock(
  "@/lib/staff/staff-user-repository",
  () => ({
    listStaffUsers,
    listStaffUsersByDepartment,
  })
);

const authorization = {
  userId: 1,
  publicId:
    "super-admin-public-id",
  departmentId: 1,
  departmentCode: "ADMIN",
  roles: ["SUPER_ADMIN"],
  permissions: [
    "USER_VIEW",
    "USER_MANAGE",
    "ROLE_VIEW",
    "ROLE_ASSIGN",
  ],
};

const createdUser = {
  id: 25,
  publicId:
    "33333333-3333-4333-8333-333333333333",
  departmentId: 2,
  departmentPublicId:
    "11111111-1111-4111-8111-111111111111",
  departmentCode: "TRADE",
  departmentName:
    "Trade Department",
  firstName: "Amina",
  lastName: "Ibrahim",
  email:
    "amina@example.com",
  isActive: true,
  lastLoginAt: null,
  passwordChangedAt: null,
  createdAt: new Date(
    "2026-10-21T09:00:00.000Z"
  ),
  updatedAt: new Date(
    "2026-10-21T09:00:00.000Z"
  ),
  roles: [],
};

function createRequest(
  body: unknown
) {
  return new Request(
    "http://localhost/api/staff/users",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        body
      ),
    }
  );
}

function createCrossSiteRequest(
  body: unknown
) {
  return new Request(
    "http://localhost/api/staff/users",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        Origin:
          "https://attacker.example.com",
        "Sec-Fetch-Site":
          "cross-site",
      },
      body: JSON.stringify(
        body
      ),
    }
  );
}

function createMalformedRequest() {
  return new Request(
    "http://localhost/api/staff/users",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: "{invalid-json",
    }
  );
}

describe(
  "staff user create route",
  () => {
    beforeEach(() => {
      vi.resetAllMocks();

      getRequestAuthorization
        .mockResolvedValue(
          authorization
        );

      createStaffAccount
        .mockResolvedValue(
          createdUser
        );
    });

    it("creates a staff account and returns 201", async () => {
      const {
        POST,
      } = await import(
        "@/app/api/staff/users/route"
      );

      const response =
        await POST(
          createRequest({
            firstName:
              "  Amina  ",
            lastName:
              "  Ibrahim  ",
            email:
              "  AMINA@EXAMPLE.COM  ",
            password:
              "StrongPassword123!",
            departmentPublicId:
              "11111111-1111-4111-8111-111111111111",
          })
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(201);

      expect(
        getRequestAuthorization
      ).toHaveBeenCalledOnce();

      expect(
        createStaffAccount
      ).toHaveBeenCalledWith(
        authorization,
        {
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
          departmentPublicId:
            "11111111-1111-4111-8111-111111111111",
        }
      );

      expect(body).toEqual({
        user: {
          publicId:
            "33333333-3333-4333-8333-333333333333",
          department: {
            publicId:
              "11111111-1111-4111-8111-111111111111",
            code: "TRADE",
            name:
              "Trade Department",
          },
          firstName:
            "Amina",
          lastName:
            "Ibrahim",
          email:
            "amina@example.com",
          isActive: true,
          lastLoginAt: null,
          passwordChangedAt:
            null,
          createdAt:
            "2026-10-21T09:00:00.000Z",
          updatedAt:
            "2026-10-21T09:00:00.000Z",
          roles: [],
        },
      });

      expect(
        body.user.id
      ).toBeUndefined();

      expect(
        body.user.departmentId
      ).toBeUndefined();

      expect(
        body.user.password
      ).toBeUndefined();

      expect(
        body.user.passwordHash
      ).toBeUndefined();
    });

    it("supports creating an unassigned staff account", async () => {
      createStaffAccount
        .mockResolvedValue({
          ...createdUser,
          departmentId: null,
          departmentPublicId:
            null,
          departmentCode: null,
          departmentName: null,
        });

      const {
        POST,
      } = await import(
        "@/app/api/staff/users/route"
      );

      const response =
        await POST(
          createRequest({
            firstName:
              "Grace",
            lastName: "John",
            email:
              "grace@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              null,
          })
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(201);

      expect(
        body.user.department
      ).toBeNull();

      expect(
        createStaffAccount
      ).toHaveBeenCalledWith(
        authorization,
        expect.objectContaining({
          departmentPublicId:
            null,
        })
      );
    });

    it("rejects a cross-site request before authentication or account creation", async () => {
      const {
        POST,
      } = await import(
        "@/app/api/staff/users/route"
      );

      const response =
        await POST(
          createCrossSiteRequest({
            firstName:
              "Amina",
            lastName:
              "Ibrahim",
            email:
              "amina@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              "11111111-1111-4111-8111-111111111111",
          })
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(403);

      expect(body).toEqual({
        error:
          "Cross-site request forbidden.",
      });

      expect(
        getRequestAuthorization
      ).not.toHaveBeenCalled();

      expect(
        createStaffAccount
      ).not.toHaveBeenCalled();
    });

    it("returns 400 for malformed JSON", async () => {
      const {
        POST,
      } = await import(
        "@/app/api/staff/users/route"
      );

      const response =
        await POST(
          createMalformedRequest()
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(400);

      expect(body).toEqual({
        error:
          "Invalid JSON request body.",
      });

      expect(
        createStaffAccount
      ).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid staff user data", async () => {
      const {
        POST,
      } = await import(
        "@/app/api/staff/users/route"
      );

      const response =
        await POST(
          createRequest({
            firstName: "",
            lastName: "",
            email:
              "not-an-email",
            password: "short",
            departmentPublicId:
              "not-a-uuid",
          })
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(400);

      expect(
        body
      ).toHaveProperty(
        "error",
        "Invalid staff user data."
      );

      expect(
        body
      ).toHaveProperty(
        "details"
      );

      expect(
        createStaffAccount
      ).not.toHaveBeenCalled();
    });

    it("rejects unexpected fields including roles", async () => {
      const {
        POST,
      } = await import(
        "@/app/api/staff/users/route"
      );

      const response =
        await POST(
          createRequest({
            firstName:
              "Amina",
            lastName:
              "Ibrahim",
            email:
              "amina@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              "11111111-1111-4111-8111-111111111111",
            roles: [
              "SUPER_ADMIN",
            ],
          })
        );

      expect(
        response.status
      ).toBe(400);

      expect(
        createStaffAccount
      ).not.toHaveBeenCalled();
    });

    it("returns 409 when the staff email already exists", async () => {
      createStaffAccount
        .mockRejectedValue(
          new StaffEmailConflictError()
        );

      const {
        POST,
      } = await import(
        "@/app/api/staff/users/route"
      );

      const response =
        await POST(
          createRequest({
            firstName:
              "Amina",
            lastName:
              "Ibrahim",
            email:
              "amina@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              "11111111-1111-4111-8111-111111111111",
          })
        );

      const body =
        await response.json();

      expect(
        response.status
      ).toBe(409);

      expect(body).toEqual({
        error:
          "A staff account with this email address already exists.",
      });
    });

    it("returns 401 when the request is unauthenticated", async () => {
      getRequestAuthorization
        .mockRejectedValue(
          new UnauthenticatedError()
        );

      const {
        POST,
      } = await import(
        "@/app/api/staff/users/route"
      );

      const response =
        await POST(
          createRequest({
            firstName:
              "Amina",
            lastName:
              "Ibrahim",
            email:
              "amina@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              "11111111-1111-4111-8111-111111111111",
          })
        );

      expect(
        response.status
      ).toBe(401);

      expect(
        createStaffAccount
      ).not.toHaveBeenCalled();
    });

    it("returns 403 when staff lacks permission or department access", async () => {
      createStaffAccount
        .mockRejectedValue(
          new ForbiddenError()
        );

      const {
        POST,
      } = await import(
        "@/app/api/staff/users/route"
      );

      const response =
        await POST(
          createRequest({
            firstName:
              "Amina",
            lastName:
              "Ibrahim",
            email:
              "amina@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              "11111111-1111-4111-8111-111111111111",
          })
        );

      expect(
        response.status
      ).toBe(403);
    });

    it("rethrows unexpected staff creation errors", async () => {
      createStaffAccount
        .mockRejectedValue(
          new Error(
            "Database unavailable"
          )
        );

      const {
        POST,
      } = await import(
        "@/app/api/staff/users/route"
      );

      await expect(
        POST(
          createRequest({
            firstName:
              "Amina",
            lastName:
              "Ibrahim",
            email:
              "amina@example.com",
            password:
              "StrongPassword123!",
            departmentPublicId:
              "11111111-1111-4111-8111-111111111111",
          })
        )
      ).rejects.toThrow(
        "Database unavailable"
      );
    });
  }
);