import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  createStaffDepartment,
  getStaffDepartments,
  updateStaffDepartment,
} from "@/lib/staff-ui/staff-departments-client";

describe(
  "staff departments client",
  () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("loads staff departments", async () => {
      const fetchMock =
        vi.spyOn(
          globalThis,
          "fetch"
        );

      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            departments: [
              {
                publicId:
                  "11111111-1111-4111-8111-111111111111",
                code: "TRADE",
                name:
                  "Trade Department",
                isActive: true,
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      const departments =
        await getStaffDepartments();

      expect(
        fetchMock
      ).toHaveBeenCalledWith(
        "/api/staff/departments",
        {
          method: "GET",
        }
      );

      expect(
        departments
      ).toEqual([
        {
          publicId:
            "11111111-1111-4111-8111-111111111111",
          code: "TRADE",
          name:
            "Trade Department",
          isActive: true,
        },
      ]);
    });

    it("throws the API error when loading departments fails", async () => {
      vi.spyOn(
        globalThis,
        "fetch"
      ).mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "Forbidden.",
          }),
          {
            status: 403,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      await expect(
        getStaffDepartments()
      ).rejects.toThrow(
        "Forbidden."
      );
    });

    it("uses a safe error when the department error response cannot be read", async () => {
      vi.spyOn(
        globalThis,
        "fetch"
      ).mockResolvedValue(
        new Response(
          "not-json",
          {
            status: 500,
          }
        )
      );

      await expect(
        getStaffDepartments()
      ).rejects.toThrow(
        "Unable to load departments."
      );
    });

    it("creates a staff department", async () => {
      const fetchMock =
        vi.spyOn(
          globalThis,
          "fetch"
        );

      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            department: {
              publicId:
                "22222222-2222-4222-8222-222222222222",
              code: "INDUSTRY",
              name:
                "Industry Department",
              isActive: true,
            },
          }),
          {
            status: 201,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      const department =
        await createStaffDepartment({
          code: "INDUSTRY",
          name:
            "Industry Department",
        });

      expect(
        fetchMock
      ).toHaveBeenCalledWith(
        "/api/staff/departments",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            code: "INDUSTRY",
            name:
              "Industry Department",
          }),
        }
      );

      expect(
        department
      ).toEqual({
        publicId:
          "22222222-2222-4222-8222-222222222222",
        code: "INDUSTRY",
        name:
          "Industry Department",
        isActive: true,
      });
    });

    it("throws the API error when department creation fails", async () => {
      vi.spyOn(
        globalThis,
        "fetch"
      ).mockResolvedValue(
        new Response(
          JSON.stringify({
            error:
              "Department code already exists.",
          }),
          {
            status: 409,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      await expect(
        createStaffDepartment({
          code: "TRADE",
          name:
            "Another Trade Department",
        })
      ).rejects.toThrow(
        "Department code already exists."
      );
    });

    it("updates a staff department", async () => {
      const fetchMock =
        vi.spyOn(
          globalThis,
          "fetch"
        );

      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            department: {
              publicId:
                "11111111-1111-4111-8111-111111111111",
              code: "TRADE",
              name:
                "Trade and Commerce Department",
              isActive: false,
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      const department =
        await updateStaffDepartment(
          "11111111-1111-4111-8111-111111111111",
          {
            name:
              "Trade and Commerce Department",
            isActive: false,
          }
        );

      expect(
        fetchMock
      ).toHaveBeenCalledWith(
        "/api/staff/departments/11111111-1111-4111-8111-111111111111",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name:
              "Trade and Commerce Department",
            isActive: false,
          }),
        }
      );

      expect(
        department
      ).toEqual({
        publicId:
          "11111111-1111-4111-8111-111111111111",
        code: "TRADE",
        name:
          "Trade and Commerce Department",
        isActive: false,
      });
    });

    it("does not send an editable department code during update", async () => {
      const fetchMock =
        vi.spyOn(
          globalThis,
          "fetch"
        );

      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            department: {
              publicId:
                "11111111-1111-4111-8111-111111111111",
              code: "TRADE",
              name:
                "Trade Department",
              isActive: true,
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      await updateStaffDepartment(
        "11111111-1111-4111-8111-111111111111",
        {
          name:
            "Trade Department",
          isActive: true,
        }
      );

      const options =
        fetchMock.mock
          .calls[0][1];

      const body = JSON.parse(
        String(options?.body)
      );

      expect(
        body
      ).not.toHaveProperty(
        "code"
      );
    });

    it("throws the API error when department update fails", async () => {
      vi.spyOn(
        globalThis,
        "fetch"
      ).mockResolvedValue(
        new Response(
          JSON.stringify({
            error:
              "Department not found.",
          }),
          {
            status: 404,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        )
      );

      await expect(
        updateStaffDepartment(
          "11111111-1111-4111-8111-111111111111",
          {
            name:
              "Trade Department",
          }
        )
      ).rejects.toThrow(
        "Department not found."
      );
    });
  }
);