import {
  parseStaffLoginInput,
} from "./staff-login";
import {
  findActiveStaffByEmail,
} from "./staff-auth-repository";
import {
  verifyPassword,
} from "./password";
import {
  createStaffSession,
} from "./session-repository";

export class InvalidStaffCredentialsError extends Error {
  constructor() {
    super("Invalid email or password.");
    this.name =
      "InvalidStaffCredentialsError";
  }
}

export type AuthenticatedStaffUser = {
  id: number;
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: number | null;
  departmentCode: string | null;
};

export type StaffAuthenticationResult = {
  user: AuthenticatedStaffUser;
  session: {
    token: string;
    expiresAt: Date;
  };
};

export async function authenticateStaff(
  input: unknown
): Promise<StaffAuthenticationResult> {
  const credentials =
    parseStaffLoginInput(input);

  const user = await findActiveStaffByEmail(
    credentials.email
  );

  if (!user) {
    throw new InvalidStaffCredentialsError();
  }

  const passwordIsValid =
    await verifyPassword(
      credentials.password,
      user.passwordHash
    );

  if (!passwordIsValid) {
    throw new InvalidStaffCredentialsError();
  }

  const session = await createStaffSession(
    user.id
  );

  return {
    user: {
      id: user.id,
      publicId: user.publicId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      departmentId: user.departmentId,
      departmentCode: user.departmentCode,
    },
    session,
  };
}