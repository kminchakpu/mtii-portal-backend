import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import {
  db,
} from "@/lib/db/pool";
import {
  handleApplicantDatabaseError,
} from "@/lib/applicant-auth/database-error";

type ApplicantExecutor = {
  execute<T>(
    sql: string,
    values?: unknown[]
  ): Promise<[T, unknown]>;
};

type ApplicantRow =
  RowDataPacket & {
    id: number;
    public_id: string;
    first_name: string;
    last_name: string;
    email: string;
    password_hash: string;
    email_verified_at:
      Date | null;
    is_active:
      number | boolean;
    created_at: Date;
    updated_at: Date;
  };

export type Applicant = {
  id: number;
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt:
    Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateApplicantRecord = {
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
};

function mapApplicant(
  row: ApplicantRow
): Applicant {
  return {
    id: row.id,
    publicId:
      row.public_id,
    firstName:
      row.first_name,
    lastName:
      row.last_name,
    email: row.email,
    passwordHash:
      row.password_hash,
    emailVerifiedAt:
      row.email_verified_at,
    isActive:
      Boolean(row.is_active),
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  };
}

const applicantSelect = `
  SELECT
    id,
    public_id,
    first_name,
    last_name,
    email,
    password_hash,
    email_verified_at,
    is_active,
    created_at,
    updated_at
  FROM applicants
`;

async function findApplicantById(
  id: number,
  executor:
    ApplicantExecutor = db
): Promise<Applicant | null> {
  const [rows] =
    await executor.execute<
      ApplicantRow[]
    >(
      `
        ${applicantSelect}
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

  const applicant =
    rows[0];

  if (!applicant) {
    return null;
  }

  return mapApplicant(
    applicant
  );
}

export async function findApplicantByEmail(
  email: string,
  executor:
    ApplicantExecutor = db
): Promise<Applicant | null> {
  const [rows] =
    await executor.execute<
      ApplicantRow[]
    >(
      `
        ${applicantSelect}
        WHERE email = ?
        LIMIT 1
      `,
      [email]
    );

  const applicant =
    rows[0];

  if (!applicant) {
    return null;
  }

  return mapApplicant(
    applicant
  );
}

export async function createApplicant(
  input: CreateApplicantRecord,
  executor:
    ApplicantExecutor = db
): Promise<Applicant> {
  try {
    const [result] =
      await executor.execute<
        ResultSetHeader
      >(
        `
          INSERT INTO applicants (
            public_id,
            first_name,
            last_name,
            email,
            password_hash
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          input.publicId,
          input.firstName,
          input.lastName,
          input.email,
          input.passwordHash,
        ]
      );

    const applicant =
      await findApplicantById(
        result.insertId,
        executor
      );

    if (!applicant) {
      throw new Error(
        "Created applicant could not be loaded."
      );
    }

    return applicant;
  } catch (error) {
    return handleApplicantDatabaseError(
      error
    );
  }
}