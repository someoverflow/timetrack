import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
	const { nextUrl } = req;
	const isLoggedIn = !!req.auth;

	const allowedPaths = ["/api", "/signin"];
	for (const allowedPath of allowedPaths) {
		if (nextUrl.pathname.toLowerCase().startsWith(allowedPath))
			return NextResponse.next();
	}

	if (!isLoggedIn) 
		return NextResponse.redirect(new URL("/signin", req.url));
	
	return NextResponse.next();
});

export const config = {
	matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
