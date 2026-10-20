export type SeedDepartment = {
  code: string;
  name: string;
  description: string;
};

export type SeedRole = {
  code: string;
  name: string;
  description: string;
};

export type SeedPermission = {
  code: string;
  name: string;
  description: string;
};

export const departments: SeedDepartment[] = [
  {
    code: "ADMIN",
    name: "Administration",
    description:
      "Central administration and system management.",
  },
  {
    code: "TRADE",
    name: "Trade Department",
    description:
      "Manages Business Premises Registration and related trade services.",
  },
  {
    code: "COOP",
    name: "Cooperative Department",
    description:
      "Manages Cooperative Society, CBO, FBO, and NGO registrations.",
  },
  {
    code: "GRM",
    name: "Grievance Redress Mechanism",
    description:
      "Manages grievance cases, investigations, resolutions, and closure.",
  },
];

export const roles: SeedRole[] = [
  {
    code: "SUPER_ADMIN",
    name: "Super Administrator",
    description:
      "Full administrative access to the MTII staff platform.",
  },
  {
    code: "DIRECTOR",
    name: "Director",
    description:
      "Supervises departmental workflows and makes final application decisions.",
  },
  {
    code: "DEPARTMENT_ADMIN",
    name: "Department Administrator",
    description:
      "Manages staff and operational administration within a department.",
  },
  {
    code: "REVIEW_OFFICER",
    name: "Review Officer",
    description:
      "Reviews applications, requests information, and recommends decisions.",
  },
  {
    code: "GRM_OFFICER",
    name: "GRM Officer",
    description:
      "Manages grievance cases and resolution workflows.",
  },
  {
    code: "REPORTING_OFFICER",
    name: "Reporting Officer",
    description:
      "Views and exports authorized operational reports.",
  },
  {
    code: "AUDITOR",
    name: "Auditor",
    description:
      "Provides read-only access to authorized audit information.",
  },
];

export const permissions: SeedPermission[] = [
  {
    code: "DEPARTMENT_VIEW",
    name: "View Departments",
    description: "View MTII departments.",
  },
  {
    code: "DEPARTMENT_MANAGE",
    name: "Manage Departments",
    description:
      "Create, update, activate, and deactivate departments.",
  },
  {
    code: "USER_VIEW",
    name: "View Staff Users",
    description: "View staff user accounts.",
  },
  {
    code: "USER_MANAGE",
    name: "Manage Staff Users",
    description:
      "Create, update, activate, and deactivate staff accounts.",
  },
  {
    code: "ROLE_VIEW",
    name: "View Roles",
    description: "View staff roles and their permissions.",
  },
  {
    code: "ROLE_ASSIGN",
    name: "Assign Roles",
    description: "Assign authorized roles to staff users.",
  },
  {
    code: "APPLICATION_VIEW",
    name: "View Applications",
    description:
      "View applications within the authorized department scope.",
  },
  {
    code: "APPLICATION_REVIEW",
    name: "Review Applications",
    description:
      "Review submitted applications within the authorized department scope.",
  },
  {
    code: "APPLICATION_ASSIGN",
    name: "Assign Applications",
    description:
      "Assign applications to authorized reviewing officers.",
  },
  {
    code: "APPLICATION_REQUEST_INFORMATION",
    name: "Request Application Information",
    description:
      "Request additional information from an applicant.",
  },
  {
    code: "APPLICATION_RECOMMEND",
    name: "Recommend Application Decision",
    description:
      "Recommend an application for approval or rejection.",
  },
  {
    code: "APPLICATION_APPROVE",
    name: "Approve Applications",
    description:
      "Make the final approval decision for an authorized application.",
  },
  {
    code: "APPLICATION_REJECT",
    name: "Reject Applications",
    description:
      "Make the final rejection decision for an authorized application.",
  },
  {
    code: "CERTIFICATE_GENERATE",
    name: "Generate Certificates",
    description:
      "Generate certificates for approved registrations.",
  },
  {
    code: "CERTIFICATE_VIEW",
    name: "View Certificates",
    description:
      "View certificates within the authorized department scope.",
  },
  {
    code: "GRM_VIEW",
    name: "View GRM Cases",
    description: "View authorized grievance cases.",
  },
  {
    code: "GRM_MANAGE",
    name: "Manage GRM Cases",
    description:
      "Manage grievance assignment, investigation, resolution, and closure.",
  },
  {
    code: "REPORT_VIEW",
    name: "View Reports",
    description: "View authorized operational reports.",
  },
  {
    code: "REPORT_EXPORT",
    name: "Export Reports",
    description: "Export authorized operational reports.",
  },
  {
    code: "AUDIT_VIEW",
    name: "View Audit Logs",
    description: "View authorized immutable audit records.",
  },
];

export const rolePermissions: Record<string, string[]> = {
  SUPER_ADMIN: permissions.map(
    (permission) => permission.code
  ),
  DIRECTOR: [
    "APPLICATION_VIEW",
    "APPLICATION_REVIEW",
    "APPLICATION_ASSIGN",
    "APPLICATION_REQUEST_INFORMATION",
    "APPLICATION_RECOMMEND",
    "APPLICATION_APPROVE",
    "APPLICATION_REJECT",
    "CERTIFICATE_GENERATE",
    "CERTIFICATE_VIEW",
    "REPORT_VIEW",
    "REPORT_EXPORT",
  ],
  DEPARTMENT_ADMIN: [
    "USER_VIEW",
    "APPLICATION_VIEW",
    "APPLICATION_ASSIGN",
    "CERTIFICATE_VIEW",
    "REPORT_VIEW",
  ],
  REVIEW_OFFICER: [
    "APPLICATION_VIEW",
    "APPLICATION_REVIEW",
    "APPLICATION_REQUEST_INFORMATION",
    "APPLICATION_RECOMMEND",
    "CERTIFICATE_VIEW",
  ],
  GRM_OFFICER: [
    "GRM_VIEW",
    "GRM_MANAGE",
    "REPORT_VIEW",
  ],
  REPORTING_OFFICER: [
    "APPLICATION_VIEW",
    "CERTIFICATE_VIEW",
    "GRM_VIEW",
    "REPORT_VIEW",
    "REPORT_EXPORT",
  ],
  AUDITOR: [
    "AUDIT_VIEW",
    "REPORT_VIEW",
  ],
};