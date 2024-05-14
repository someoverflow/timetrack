import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
	const { nextUrl } = req;
	const isLoggedIn = !!req.auth;

	if (nextUrl.pathname.toLowerCase().startsWith("/api"))
		return NextResponse.next();
	if (nextUrl.pathname.toLowerCase().startsWith("/signin")) {
		if (!isLoggedIn) return NextResponse.next();
		return NextResponse.redirect(req.url.replace(req.nextUrl.pathname, "/"));
	}

	if (!isLoggedIn) {
		const signInUrl = new URL("/signin", req.url);
		signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
		return NextResponse.redirect(signInUrl);
	}

	return NextResponse.next();
});

export const config = {
	matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
