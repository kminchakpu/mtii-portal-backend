import {
  isStaffRequestOriginAllowed,
} from "./staff-request-origin";

export class StaffCrossSiteRequestError
  extends Error {
  constructor() {
    super(
      "Cross-site request forbidden."
    );
    this.name =
      "StaffCrossSiteRequestError";
  }
}

export function enforceStaffRequestOrigin(
  request: Request
): void {
  if (
    !isStaffRequestOriginAllowed(
      request
    )
  ) {
    throw new StaffCrossSiteRequestError();
  }
}