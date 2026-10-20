export type SessionState = {
  expiresAt: Date;
  revokedAt: Date | null;
};

export function isSessionActive(
  session: SessionState,
  now: Date = new Date()
): boolean {
  if (session.revokedAt !== null) {
    return false;
  }

  return session.expiresAt.getTime() > now.getTime();
}