import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  createTransportMock,
  sendMailMock,
} = vi.hoisted(
  () => ({
    createTransportMock:
      vi.fn(),
    sendMailMock:
      vi.fn(),
  })
);

vi.mock(
  "nodemailer",
  () => ({
    default: {
      createTransport:
        createTransportMock,
    },
  })
);

import {
  sendEmail,
} from "@/lib/email/email-service";

describe(
  "email service",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      sendMailMock.mockResolvedValue({
        messageId:
          "test-message-id",
      });

      createTransportMock.mockReturnValue({
        sendMail:
          sendMailMock,
      });
    });

    it("creates an SMTP transport using the configured connection settings", async () => {
      await sendEmail(
        {
          to:
            "applicant@example.com",
          subject:
            "Verify your account",
          text:
            "Plain text message",
          html:
            "<p>HTML message</p>",
        },
        {
          SMTP_HOST:
            "smtp.example.com",
          SMTP_PORT:
            "465",
          SMTP_SECURE:
            "true",
          SMTP_USER:
            "mailer@example.com",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "noreply@example.com",
          SMTP_FROM_NAME:
            "MTII Nasarawa",
        }
      );

      expect(
        createTransportMock
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        createTransportMock
      ).toHaveBeenCalledWith({
        host:
          "smtp.example.com",
        port: 465,
        secure: true,
        auth: {
          user:
            "mailer@example.com",
          pass:
            "secret-password",
        },
      });
    });

    it("sends email using the configured sender", async () => {
      await sendEmail(
        {
          to:
            "applicant@example.com",
          subject:
            "Verify your account",
          text:
            "Plain text message",
          html:
            "<p>HTML message</p>",
        },
        {
          SMTP_HOST:
            "smtp.example.com",
          SMTP_PORT:
            "587",
          SMTP_SECURE:
            "false",
          SMTP_USER:
            "mailer@example.com",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "noreply@example.com",
          SMTP_FROM_NAME:
            "MTII Nasarawa",
        }
      );

      expect(
        sendMailMock
      ).toHaveBeenCalledTimes(
        1
      );

      expect(
        sendMailMock
      ).toHaveBeenCalledWith({
        from: {
          name:
            "MTII Nasarawa",
          address:
            "noreply@example.com",
        },
        to:
          "applicant@example.com",
        subject:
          "Verify your account",
        text:
          "Plain text message",
        html:
          "<p>HTML message</p>",
      });
    });

    it("sends to the requested recipient", async () => {
      await sendEmail(
        {
          to:
            "amina@example.com",
          subject:
            "Verify your account",
          text:
            "Plain text message",
          html:
            "<p>HTML message</p>",
        },
        {
          SMTP_HOST:
            "smtp.example.com",
          SMTP_PORT:
            "465",
          SMTP_SECURE:
            "true",
          SMTP_USER:
            "mailer@example.com",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "noreply@example.com",
          SMTP_FROM_NAME:
            "MTII Nasarawa",
        }
      );

      expect(
        sendMailMock
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          to:
            "amina@example.com",
        })
      );
    });

    it("provides both plain-text and HTML content", async () => {
      await sendEmail(
        {
          to:
            "applicant@example.com",
          subject:
            "Verify your account",
          text:
            "Verification text",
          html:
            "<p>Verification HTML</p>",
        },
        {
          SMTP_HOST:
            "smtp.example.com",
          SMTP_PORT:
            "465",
          SMTP_SECURE:
            "true",
          SMTP_USER:
            "mailer@example.com",
          SMTP_PASSWORD:
            "secret-password",
          SMTP_FROM_EMAIL:
            "noreply@example.com",
          SMTP_FROM_NAME:
            "MTII Nasarawa",
        }
      );

      expect(
        sendMailMock
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          text:
            "Verification text",
          html:
            "<p>Verification HTML</p>",
        })
      );
    });

    it("returns the mail provider message identifier", async () => {
      sendMailMock.mockResolvedValue({
        messageId:
          "provider-message-123",
      });

      const result =
        await sendEmail(
          {
            to:
              "applicant@example.com",
            subject:
              "Verify your account",
            text:
              "Plain text message",
            html:
              "<p>HTML message</p>",
          },
          {
            SMTP_HOST:
              "smtp.example.com",
            SMTP_PORT:
              "465",
            SMTP_SECURE:
              "true",
            SMTP_USER:
              "mailer@example.com",
            SMTP_PASSWORD:
              "secret-password",
            SMTP_FROM_EMAIL:
              "noreply@example.com",
            SMTP_FROM_NAME:
              "MTII Nasarawa",
          }
        );

      expect(
        result
      ).toEqual({
        messageId:
          "provider-message-123",
      });
    });

    it("propagates mail transport failures without exposing credentials", async () => {
      sendMailMock.mockRejectedValue(
        new Error(
          "SMTP delivery failed"
        )
      );

      const operation =
        sendEmail(
          {
            to:
              "applicant@example.com",
            subject:
              "Verify your account",
            text:
              "Plain text message",
            html:
              "<p>HTML message</p>",
          },
          {
            SMTP_HOST:
              "smtp.example.com",
            SMTP_PORT:
              "465",
            SMTP_SECURE:
              "true",
            SMTP_USER:
              "mailer@example.com",
            SMTP_PASSWORD:
              "super-secret-password",
            SMTP_FROM_EMAIL:
              "noreply@example.com",
            SMTP_FROM_NAME:
              "MTII Nasarawa",
          }
        );

      await expect(
        operation
      ).rejects.toThrow(
        "SMTP delivery failed"
      );

      try {
        await operation;
      } catch (error) {
        expect(
          String(error)
        ).not.toContain(
          "super-secret-password"
        );
      }
    });
  }
);