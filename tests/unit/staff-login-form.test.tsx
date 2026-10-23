// @vitest-environment jsdom

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  loginStaff: vi.fn(),
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
}));

vi.mock(
  "@/lib/staff-ui/staff-auth-client",
  () => ({
    loginStaff:
      mocks.loginStaff,
  })
);

vi.mock(
  "next/navigation",
  () => ({
    useRouter: () => ({
      push: mocks.routerPush,
      refresh:
        mocks.routerRefresh,
    }),
  })
);

import StaffLoginForm from "@/components/staff/StaffLoginForm";

describe(
  "StaffLoginForm",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("submits the entered email and password", async () => {
      const user =
        userEvent.setup();

      mocks.loginStaff
        .mockResolvedValue({
          publicId:
            "11111111-1111-4111-8111-111111111111",
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          departmentCode:
            "TRADE",
        });

      render(
        <StaffLoginForm />
      );

      await user.type(
        screen.getByLabelText(
          /email address/i
        ),
        "amina@example.com"
      );

      await user.type(
        screen.getByLabelText(
          /password/i
        ),
        "StrongPassword123!"
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: /sign in/i,
          }
        )
      );

      await waitFor(() => {
        expect(
          mocks.loginStaff
        ).toHaveBeenCalledWith({
          email:
            "amina@example.com",
          password:
            "StrongPassword123!",
        });
      });
    });

    it("navigates to the staff dashboard after successful login", async () => {
      const user =
        userEvent.setup();

      mocks.loginStaff
        .mockResolvedValue({
          publicId:
            "11111111-1111-4111-8111-111111111111",
          firstName: "Amina",
          lastName: "Ibrahim",
          email:
            "amina@example.com",
          departmentCode:
            "TRADE",
        });

      render(
        <StaffLoginForm />
      );

      await user.type(
        screen.getByLabelText(
          /email address/i
        ),
        "amina@example.com"
      );

      await user.type(
        screen.getByLabelText(
          /password/i
        ),
        "StrongPassword123!"
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: /sign in/i,
          }
        )
      );

      await waitFor(() => {
        expect(
          mocks.routerPush
        ).toHaveBeenCalledWith(
          "/staff/dashboard"
        );

        expect(
          mocks.routerRefresh
        ).toHaveBeenCalled();
      });
    });

    it("shows the authentication error when login fails", async () => {
      const user =
        userEvent.setup();

      mocks.loginStaff
        .mockRejectedValue(
          new Error(
            "Invalid email or password."
          )
        );

      render(
        <StaffLoginForm />
      );

      await user.type(
        screen.getByLabelText(
          /email address/i
        ),
        "amina@example.com"
      );

      await user.type(
        screen.getByLabelText(
          /password/i
        ),
        "wrong-password"
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: /sign in/i,
          }
        )
      );

      expect(
        (
          await screen.findByRole(
            "alert"
          )
        ).textContent
      ).toContain(
        "Invalid email or password."
      );

      expect(
        mocks.routerPush
      ).not.toHaveBeenCalled();
    });

    it("uses a safe message for an unexpected login failure", async () => {
      const user =
        userEvent.setup();

      mocks.loginStaff
        .mockRejectedValue(
          "unexpected failure"
        );

      render(
        <StaffLoginForm />
      );

      await user.type(
        screen.getByLabelText(
          /email address/i
        ),
        "amina@example.com"
      );

      await user.type(
        screen.getByLabelText(
          /password/i
        ),
        "StrongPassword123!"
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: /sign in/i,
          }
        )
      );

      expect(
        (
          await screen.findByRole(
            "alert"
          )
        ).textContent
      ).toContain(
        "Unable to sign in at this time."
      );

      expect(
        mocks.routerPush
      ).not.toHaveBeenCalled();
    });

    it("prevents another submission while login is already in progress", async () => {
      let resolveLogin:
        | (() => void)
        | undefined;

      mocks.loginStaff
        .mockImplementation(
          () =>
            new Promise(
              (resolve) => {
                resolveLogin =
                  () =>
                    resolve({
                      publicId:
                        "11111111-1111-4111-8111-111111111111",
                      firstName:
                        "Amina",
                      lastName:
                        "Ibrahim",
                      email:
                        "amina@example.com",
                      departmentCode:
                        "TRADE",
                    });
              }
            )
        );

      render(
        <StaffLoginForm />
      );

      fireEvent.change(
        screen.getByLabelText(
          /email address/i
        ),
        {
          target: {
            value:
              "amina@example.com",
          },
        }
      );

      fireEvent.change(
        screen.getByLabelText(
          /password/i
        ),
        {
          target: {
            value:
              "StrongPassword123!",
          },
        }
      );

      const form =
        screen
          .getByRole(
            "button",
            {
              name: /sign in/i,
            }
          )
          .closest("form");

      expect(form).not.toBeNull();

      fireEvent.submit(
        form as HTMLFormElement
      );

      await waitFor(() => {
        expect(
          mocks.loginStaff
        ).toHaveBeenCalledTimes(
          1
        );
      });

      expect(
        (
          screen.getByRole(
            "button",
            {
              name: /signing in/i,
            }
          ) as HTMLButtonElement
        ).disabled
      ).toBe(true);

      fireEvent.submit(
        form as HTMLFormElement
      );

      expect(
        mocks.loginStaff
      ).toHaveBeenCalledTimes(
        1
      );

      resolveLogin?.();

      await waitFor(() => {
        expect(
          mocks.routerPush
        ).toHaveBeenCalledWith(
          "/staff/dashboard"
        );
      });
    });
  }
);