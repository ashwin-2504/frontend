export const isSessionAuthError = (error) => {
  const message = String(error?.message || error || "");
  const code = String(error?.code || "");

  return (
    code === "auth/no-current-user" ||
    code === "auth/session-expired" ||
    message.includes("No signed-in user") ||
    message.includes("Session expired") ||
    message.includes("Sign in again before continuing")
  );
};
