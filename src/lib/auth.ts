
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  plugins: [
    nextCookies()
  ],
  emailAndPassword: {
    enabled: true,
  },
  session: {
    // Expire session after 30 minutes of inactivity
    expiresIn: 30 * 60, // 30 minutes in seconds
  }
});
