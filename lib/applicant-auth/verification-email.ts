export type ApplicantVerificationEmailInput = {
  firstName: string;
  verificationUrl: string;
};

export type ApplicantVerificationEmail = {
  subject: string;
  text: string;
  html: string;
};

const VERIFICATION_PATH =
  "/api/applicant/auth/verify-email";

function escapeHtml(
  value: string
): string {
  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#39;"
    );
}

export function buildApplicantVerificationUrl(
  token: string,
  appUrl: string
): string {
  const normalizedAppUrl =
    appUrl.replace(
      /\/+$/,
      ""
    );

  return (
    `${normalizedAppUrl}` +
    `${VERIFICATION_PATH}` +
    `?token=${encodeURIComponent(token)}`
  );
}

export function buildApplicantVerificationEmail(
  input: ApplicantVerificationEmailInput
): ApplicantVerificationEmail {
  const subject =
    "Verify your MTII applicant account";

  const text = [
    `Hello ${input.firstName},`,
    "",
    "Thank you for creating an MTII applicant account.",
    "",
    "Please verify your email address before you can log in.",
    "",
    "Use the verification link below:",
    "",
    input.verificationUrl,
    "",
    "If you did not create this account, you can ignore this email.",
    "",
    "Nasarawa State Ministry of Trade, Industry and Investment",
  ].join(
    "\n"
  );

  const safeFirstName =
    escapeHtml(
      input.firstName
    );

  const safeVerificationUrl =
    escapeHtml(
      input.verificationUrl
    );

  const html = [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `<title>${subject}</title>`,
    "</head>",
    "<body>",
    `<p>Hello ${safeFirstName},</p>`,
    "<p>Thank you for creating an MTII applicant account.</p>",
    "<p>Please verify your email address before you can log in.</p>",
    "<p>",
    `<a href="${safeVerificationUrl}">Verify your email address</a>`,
    "</p>",
    "<p>If you did not create this account, you can ignore this email.</p>",
    "<p>Nasarawa State Ministry of Trade, Industry and Investment</p>",
    "</body>",
    "</html>",
  ].join(
    ""
  );

  return {
    subject,
    text,
    html,
  };
}