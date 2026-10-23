// @vitest-environment jsdom

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  logoutStaff: vi.fn(),
  routerReplace: vi.fn(),
  routerRefresh: vi.fn(),
}));

vi.mock(
  "@/lib/staff-ui/staff-auth-client",
  () => ({
    logoutStaff:
      mocks.logoutStaff,
  })
);

vi.mock(
  "next/navigation",
  () => ({
    useRouter: () => ({
      replace:
        mocks.routerReplace,
      refresh:
        mocks.routerRefresh,
    }),
  })
);

import StaffSignOutButton from "@/components/staff/StaffSignOutButton";

describe(
  "StaffSignOutButton",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("signs the staff member out", async () => {
      const user =
        userEvent.setup();

      mocks.logoutStaff
        .mockResolvedValue(
          undefined
        );

      render(
        <StaffSignOutButton />
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: /sign out/i,
          }
        )
      );

      await waitFor(() => {
        expect(
          mocks.logoutStaff
        ).toHaveBeenCalledTimes(
          1
        );
      });
    });

    it("returns to the staff login page after successful sign out", async () => {
      const user =
        userEvent.setup();

      mocks.logoutStaff
        .mockResolvedValue(
          undefined
        );

      render(
        <StaffSignOutButton />
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: /sign out/i,
          }
        )
      );

      await waitFor(() => {
        expect(
          mocks.routerReplace
        ).toHaveBeenCalledWith(
          "/staff/login"
        );

        expect(
          mocks.routerRefresh
        ).toHaveBeenCalled();
      });
    });

    it("disables repeated sign-out attempts while the request is pending", async () => {
      let resolveLogout:
        | (() => void)
        | undefined;

      mocks.logoutStaff
        .mockImplementation(
          () =>
            new Promise<void>(
              (resolve) => {
                resolveLogout =
                  resolve;
              }
            )
        );

      const user =
        userEvent.setup();

      render(
        <StaffSignOutButton />
      );

      const button =
        screen.getByRole(
          "button",
          {
            name: /sign out/i,
          }
        );

      await user.click(
        button
      );

      await waitFor(() => {
        expect(
          mocks.logoutStaff
        ).toHaveBeenCalledTimes(
          1
        );
      });

      const pendingButton =
        screen.getByRole(
          "button",
          {
            name: /signing out/i,
          }
        ) as HTMLButtonElement;

      expect(
        pendingButton.disabled
      ).toBe(true);

      await user.click(
        pendingButton
      );

      expect(
        mocks.logoutStaff
      ).toHaveBeenCalledTimes(
        1
      );

      resolveLogout?.();

      await waitFor(() => {
        expect(
          mocks.routerReplace
        ).toHaveBeenCalledWith(
          "/staff/login"
        );
      });
    });

    it("shows an error and keeps the staff member on the current page when sign out fails", async () => {
      const user =
        userEvent.setup();

      mocks.logoutStaff
        .mockRejectedValue(
          new Error(
            "Unable to sign out at this time."
          )
        );

      render(
        <StaffSignOutButton />
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: /sign out/i,
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
        "Unable to sign out at this time."
      );

      expect(
        mocks.routerReplace
      ).not.toHaveBeenCalled();

      expect(
        mocks.routerRefresh
      ).not.toHaveBeenCalled();
    });

    it("uses a safe message for an unexpected sign-out failure", async () => {
      const user =
        userEvent.setup();

      mocks.logoutStaff
        .mockRejectedValue(
          "unexpected failure"
        );

      render(
        <StaffSignOutButton />
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: /sign out/i,
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
        "Unable to sign out at this time."
      );
    });
  }
);