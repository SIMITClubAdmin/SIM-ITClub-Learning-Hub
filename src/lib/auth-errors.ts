/** Supabase Auth's error messages, in the hub's words. */
export function friendlyError(message: string) {
  if (message.includes("Invalid login credentials")) return "That email or password is incorrect.";
  if (message.includes("Email not confirmed")) {
    return "Please confirm your email first. Check your inbox for the link.";
  }
  if (message.includes("Signups not allowed")) {
    return "New accounts can't be created right now. ITCamp subcomms: log in with your club account.";
  }
  if (message.includes("Database error saving new user")) {
    return "We could not create your account. Please try again.";
  }
  if (message.toLowerCase().includes("rate limit")) {
    return "Too many emails were sent recently. Please try again in a while.";
  }
  return message;
}
