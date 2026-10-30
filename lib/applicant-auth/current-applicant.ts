import type {
  RowDataPacket,
} from "mysql2/promise";

import {
  getApplicantSessionConfig,
} from "@/lib/applicant-auth/applicant-session-config";

import {
  hashApplicantSessionToken,
} from "@/lib/applicant-auth/applicant-session-token";

import {
  db,
} from "@/lib/db/pool";

interface CurrentApplicantRow
  extends RowDataPacket {
  id: number;
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export type CurrentApplicant = {
  id: number;
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
};

function getCookieValue(
  request: Request,
  cookieName: string
): string | null {
  const cookieHeader =
    request.headers.get(
      "cookie"
    );

  if (!cookieHeader) {
    return null;
  }

  const cookies =
    cookieHeader.split(";");

  for (
    const cookie of cookies
  ) {
    const trimmedCookie =
      cookie.trim();

    const separatorIndex =
      trimmedCookie.indexOf(
        "="
      );

    if (
      separatorIndex === -1
    ) {
      continue;
    }

    const name =
      trimmedCookie
        .slice(
          0,
          separatorIndex
        )
        .trim();

    if (
      name !== cookieName
    ) {
      continue;
    }

    const value =
      trimmedCookie
        .slice(
          separatorIndex + 1
        )
        .trim();

    if (!value) {
      return null;
    }

    return value;
  }

  return null;
}

export async function getCurrentApplicant(
  request: Request
): Promise<CurrentApplicant | null> {
  const {
    cookieName,
  } =
    getApplicantSessionConfig();

  const token =
    getCookieValue(
      request,
      cookieName
    );

  if (!token) {
    return null;
  }

  const tokenHash =
    hashApplicantSessionToken(
      token
    );

  const [
    rows,
  ] = await db.execute<
    CurrentApplicantRow[]
  >(
    `
      SELECT
        a.id,
        a.public_id,
        a.first_name,
        a.last_name,
        a.email
      FROM applicant_sessions s
      INNER JOIN applicants a
        ON a.id = s.applicant_id
      WHERE s.token_hash = ?
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
        AND a.is_active = TRUE
        AND a.email_verified_at IS NOT NULL
      LIMIT 1
    `,
    [
      tokenHash,
    ]
  );

  const applicant =
    rows[0];

  if (!applicant) {
    return null;
  }

  return {
    id:
      applicant.id,
    publicId:
      applicant.public_id,
    firstName:
      applicant.first_name,
    lastName:
      applicant.last_name,
    email:
      applicant.email,
  };
}