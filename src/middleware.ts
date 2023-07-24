export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/:path", "/history/:path*", "/admin/:path*"],
};
