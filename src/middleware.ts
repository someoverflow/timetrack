import { type NextRequest, NextResponse } from "next/server";

const middleware = async (req: NextRequest) => {
  const { nextUrl } = req;

  const allowedPaths = ["/api", "/login"];
  for (const allowedPath of allowedPaths) {
    if (nextUrl.pathname.toLowerCase().startsWith(allowedPath))
      return NextResponse.next();
  }

  //if (!isLoggedIn) return NextResponse.redirect(new URL("/signin", req.url));

  return NextResponse.next();
};

export default middleware;

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
