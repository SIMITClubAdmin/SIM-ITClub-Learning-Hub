/**
 * Password reset by email. The link in the email lands on PASSWORD_RESET_PATH, which signs the
 * person in and sets PASSWORD_RESET_COOKIE, so /account/password lets them choose a new
 * password without asking for the one they forgot.
 */
export const PASSWORD_RESET_PATH = "/auth/reset";

export const PASSWORD_RESET_COOKIE = "itc_password_reset";

/** Long enough to choose a new password, short enough that a forgotten tab can't use it later. */
export const PASSWORD_RESET_COOKIE_SECONDS = 15 * 60;
