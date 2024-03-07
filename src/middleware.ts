export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/:path", "/profile/:path*", "/history/:path*", "/admin/:path*"],
};
