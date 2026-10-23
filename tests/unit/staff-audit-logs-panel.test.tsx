// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  StaffAuditLogsPanel,
} from "@/components/staff/StaffAuditLogsPanel";
import {
  getStaffAuditLogs,
} from "@/lib/staff-ui/staff-audit-logs-client";

vi.mock(
  "@/lib/staff-ui/staff-audit-logs-client",
  () => ({
    getStaffAuditLogs:
      vi.fn(),
  })
);

const auditLogs = [
  {
    publicId:
      "audit-public-id-1",
    actorUserPublicId:
      "actor-public-id",
    actorFirstName:
      "Kevin",
    actorLastName:
      "Admin",
    departmentPublicId:
      "department-public-id",
    departmentCode:
      "ADMIN",
    action:
      "USER_UPDATED",
    entityType:
      "USER",
    entityId:
      "user-public-id",
    previousValues: {
      isActive: false,
    },
    newValues: {
      isActive: true,
    },
    metadata: {
      source: "staff",
    },
    ipAddress:
      "127.0.0.1",
    userAgent:
      "Vitest Browser",
    createdAt:
      "2026-10-22T10:00:00.000Z",
  },
  {
    publicId:
      "audit-public-id-2",
    actorUserPublicId: null,
    actorFirstName: null,
    actorLastName: null,
    departmentPublicId: null,
    departmentCode: null,
    action:
      "LOGIN_FAILED",
    entityType:
      "AUTH",
    entityId: null,
    previousValues: null,
    newValues: null,
    metadata: null,
    ipAddress:
      "127.0.0.2",
    userAgent: null,
    createdAt:
      "2026-10-22T09:00:00.000Z",
  },
];

const firstPage = {
  auditLogs,
  pagination: {
    page: 1,
    pageSize: 25,
    total: 30,
    totalPages: 2,
  },
};

const secondPage = {
  auditLogs: [
    auditLogs[1],
  ],
  pagination: {
    page: 2,
    pageSize: 25,
    total: 30,
    totalPages: 2,
  },
};

async function waitForAuditLogs() {
  await waitFor(() => {
    expect(
      getStaffAuditLogs
    ).toHaveBeenCalled();
  });
}

describe(
  "StaffAuditLogsPanel",
  () => {
    beforeEach(() => {
      vi.mocked(
        getStaffAuditLogs
      ).mockReset();

      vi.mocked(
        getStaffAuditLogs
      ).mockResolvedValue(
        firstPage
      );
    });

    afterEach(() => {
      cleanup();
      vi.clearAllMocks();
    });

    it(
      "loads audit logs when mounted",
      async () => {
        render(
          <StaffAuditLogsPanel />
        );

        await waitFor(
          () => {
            expect(
              getStaffAuditLogs
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          getStaffAuditLogs
        ).toHaveBeenCalledWith({
          page: 1,
          pageSize: 25,
        });
      }
    );

    it(
      "displays audit log actions and entity types",
      async () => {
        render(
          <StaffAuditLogsPanel />
        );

        await waitForAuditLogs();

        expect(
          (
            await screen.findAllByText(
              "USER_UPDATED"
            )
          ).length
        ).toBeGreaterThan(0);

        expect(
          screen.getAllByText(
            "LOGIN_FAILED"
          ).length
        ).toBeGreaterThan(0);

        expect(
          screen.getAllByText(
            "USER"
          ).length
        ).toBeGreaterThan(0);

        expect(
          screen.getAllByText(
            "AUTH"
          ).length
        ).toBeGreaterThan(0);
      }
    );

    it(
      "displays the actor name and department",
      async () => {
        render(
          <StaffAuditLogsPanel />
        );

        await waitForAuditLogs();

        expect(
          (
            await screen.findAllByText(
              "Kevin Admin"
            )
          ).length
        ).toBeGreaterThan(0);

        expect(
          screen.getAllByText(
            "ADMIN"
          ).length
        ).toBeGreaterThan(0);
      }
    );

    it(
      "shows System when an audit log has no actor",
      async () => {
        render(
          <StaffAuditLogsPanel />
        );

        await waitForAuditLogs();

        expect(
          (
            await screen.findAllByText(
              "System"
            )
          ).length
        ).toBeGreaterThan(0);
      }
    );

    it(
      "shows an empty state when there are no audit logs",
      async () => {
        vi.mocked(
          getStaffAuditLogs
        ).mockResolvedValue({
          auditLogs: [],
          pagination: {
            page: 1,
            pageSize: 25,
            total: 0,
            totalPages: 0,
          },
        });

        render(
          <StaffAuditLogsPanel />
        );

        const emptyState =
          await screen.findByText(
            "No audit logs found."
          );

        expect(
          emptyState
        ).toBeTruthy();
      }
    );

    it(
      "shows the API error when audit logs cannot be loaded",
      async () => {
        vi.mocked(
          getStaffAuditLogs
        ).mockRejectedValue(
          new Error(
            "Unable to load audit logs."
          )
        );

        render(
          <StaffAuditLogsPanel />
        );

        const errorMessage =
          await screen.findByText(
            "Unable to load audit logs."
          );

        expect(
          errorMessage
        ).toBeTruthy();
      }
    );

    it(
      "uses a safe error for an unexpected loading failure",
      async () => {
        vi.mocked(
          getStaffAuditLogs
        ).mockRejectedValue(
          "failure"
        );

        render(
          <StaffAuditLogsPanel />
        );

        const errorMessage =
          await screen.findByText(
            "Unable to load audit logs."
          );

        expect(
          errorMessage
        ).toBeTruthy();
      }
    );

    it(
      "provides audit log filter controls",
      async () => {
        render(
          <StaffAuditLogsPanel />
        );

        await waitForAuditLogs();

        expect(
          screen.getByLabelText(
            "Action"
          )
        ).toBeTruthy();

        expect(
          screen.getByLabelText(
            "Entity type"
          )
        ).toBeTruthy();

        expect(
          screen.getByLabelText(
            "Actor user public ID"
          )
        ).toBeTruthy();

        expect(
          screen.getByLabelText(
            "From"
          )
        ).toBeTruthy();

        expect(
          screen.getByLabelText(
            "To"
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Apply Filters",
            }
          )
        ).toBeTruthy();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Clear Filters",
            }
          )
        ).toBeTruthy();
      }
    );

    it(
      "applies audit log filters and resets to page one",
      async () => {
        const user =
          userEvent.setup();

        render(
          <StaffAuditLogsPanel />
        );

        await waitForAuditLogs();

        await user.type(
          screen.getByLabelText(
            "Action"
          ),
          "ROLE_ASSIGNED"
        );

        await user.type(
          screen.getByLabelText(
            "Entity type"
          ),
          "USER_ROLE"
        );

        await user.type(
          screen.getByLabelText(
            "Actor user public ID"
          ),
          "actor-public-id"
        );

        fireEvent.change(
          screen.getByLabelText(
            "From"
          ),
          {
            target: {
              value:
                "2026-10-01",
            },
          }
        );

        fireEvent.change(
          screen.getByLabelText(
            "To"
          ),
          {
            target: {
              value:
                "2026-10-22",
            },
          }
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Apply Filters",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              getStaffAuditLogs
            ).toHaveBeenLastCalledWith({
              page: 1,
              pageSize: 25,
              action:
                "ROLE_ASSIGNED",
              entityType:
                "USER_ROLE",
              actorUserPublicId:
                "actor-public-id",
              from:
                "2026-10-01T00:00:00.000Z",
              to:
                "2026-10-22T23:59:59.999Z",
            });
          }
        );
      }
    );

    it(
      "omits empty filters when applying them",
      async () => {
        const user =
          userEvent.setup();

        render(
          <StaffAuditLogsPanel />
        );

        await waitForAuditLogs();

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Apply Filters",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              getStaffAuditLogs
            ).toHaveBeenLastCalledWith({
              page: 1,
              pageSize: 25,
            });
          }
        );
      }
    );

    it(
      "clears active filters and reloads page one",
      async () => {
        const user =
          userEvent.setup();

        render(
          <StaffAuditLogsPanel />
        );

        await waitForAuditLogs();

        const actionInput =
          screen.getByLabelText(
            "Action"
          ) as HTMLInputElement;

        await user.type(
          actionInput,
          "USER_UPDATED"
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Apply Filters",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              getStaffAuditLogs
            ).toHaveBeenLastCalledWith({
              page: 1,
              pageSize: 25,
              action:
                "USER_UPDATED",
            });
          }
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Clear Filters",
            }
          )
        );

        expect(
          actionInput.value
        ).toBe("");

        await waitFor(
          () => {
            expect(
              getStaffAuditLogs
            ).toHaveBeenLastCalledWith({
              page: 1,
              pageSize: 25,
            });
          }
        );
      }
    );

    it(
      "shows the current pagination information",
      async () => {
        render(
          <StaffAuditLogsPanel />
        );

        const pageText =
          await screen.findByText(
            "Page 1 of 2"
          );

        expect(
          pageText
        ).toBeTruthy();

        expect(
          screen.getByText(
            "30 total records"
          )
        ).toBeTruthy();
      }
    );

    it(
      "disables Previous on the first page",
      async () => {
        render(
          <StaffAuditLogsPanel />
        );

        await screen.findByText(
          "Page 1 of 2"
        );

        const previousButton =
          screen.getByRole(
            "button",
            {
              name: "Previous",
            }
          ) as HTMLButtonElement;

        expect(
          previousButton.disabled
        ).toBe(true);
      }
    );

    it(
      "loads the next page while preserving active filters",
      async () => {
        const user =
          userEvent.setup();

        vi.mocked(
          getStaffAuditLogs
        )
          .mockResolvedValueOnce(
            firstPage
          )
          .mockResolvedValueOnce(
            firstPage
          )
          .mockResolvedValueOnce(
            secondPage
          );

        render(
          <StaffAuditLogsPanel />
        );

        await waitForAuditLogs();

        await user.type(
          screen.getByLabelText(
            "Action"
          ),
          "USER_UPDATED"
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Apply Filters",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              getStaffAuditLogs
            ).toHaveBeenCalledTimes(
              2
            );
          }
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name: "Next",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              getStaffAuditLogs
            ).toHaveBeenLastCalledWith({
              page: 2,
              pageSize: 25,
              action:
                "USER_UPDATED",
            });
          }
        );
      }
    );

    it(
      "loads the previous page",
      async () => {
        const user =
          userEvent.setup();

        vi.mocked(
          getStaffAuditLogs
        )
          .mockResolvedValueOnce(
            secondPage
          )
          .mockResolvedValueOnce(
            firstPage
          );

        render(
          <StaffAuditLogsPanel
            initialPage={2}
          />
        );

        const pageText =
          await screen.findByText(
            "Page 2 of 2"
          );

        expect(
          pageText
        ).toBeTruthy();

        await user.click(
          screen.getByRole(
            "button",
            {
              name: "Previous",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              getStaffAuditLogs
            ).toHaveBeenLastCalledWith({
              page: 1,
              pageSize: 25,
            });
          }
        );
      }
    );

    it(
      "disables Next on the last page",
      async () => {
        vi.mocked(
          getStaffAuditLogs
        ).mockReset();

        vi.mocked(
          getStaffAuditLogs
        ).mockResolvedValue(
          secondPage
        );

        render(
          <StaffAuditLogsPanel
            initialPage={2}
          />
        );

        await waitFor(
          () => {
            expect(
              getStaffAuditLogs
            ).toHaveBeenCalledWith({
              page: 2,
              pageSize: 25,
            });
          }
        );

        await screen.findByText(
          "Page 2 of 2"
        );

        const nextButton =
          screen.getByRole(
            "button",
            {
              name: "Next",
            }
          ) as HTMLButtonElement;

        expect(
          nextButton.disabled
        ).toBe(true);
      }
    );

    it(
      "opens audit log details",
      async () => {
        const user =
          userEvent.setup();

        render(
          <StaffAuditLogsPanel />
        );

        await waitForAuditLogs();

        const detailButtons =
          await screen.findAllByRole(
            "button",
            {
              name:
                "View Details",
            }
          );

        await user.click(
          detailButtons[0]
        );

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Audit Log Details",
            }
          )
        ).toBeTruthy();

        expect(
          screen.getAllByText(
            "user-public-id"
          ).length
        ).toBeGreaterThan(0);

        expect(
          screen.getByText(
            /"isActive": false/
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            /"isActive": true/
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            /"source": "staff"/
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            "127.0.0.1"
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            "Vitest Browser"
          )
        ).toBeTruthy();
      }
    );

    it(
      "closes audit log details",
      async () => {
        const user =
          userEvent.setup();

        render(
          <StaffAuditLogsPanel />
        );

        await waitForAuditLogs();

        const detailButtons =
          await screen.findAllByRole(
            "button",
            {
              name:
                "View Details",
            }
          );

        await user.click(
          detailButtons[0]
        );

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Audit Log Details",
            }
          )
        ).toBeTruthy();

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Close Details",
            }
          )
        );

        expect(
          screen.queryByRole(
            "heading",
            {
              name:
                "Audit Log Details",
            }
          )
        ).toBeNull();
      }
    );

    it(
      "does not expose mutation controls",
      async () => {
        render(
          <StaffAuditLogsPanel />
        );

        await waitForAuditLogs();

        expect(
          screen.queryByRole(
            "button",
            {
              name: /delete/i,
            }
          )
        ).toBeNull();

        expect(
          screen.queryByRole(
            "button",
            {
              name: /edit/i,
            }
          )
        ).toBeNull();

        expect(
          screen.queryByRole(
            "button",
            {
              name: /create/i,
            }
          )
        ).toBeNull();
      }
    );
  }
);