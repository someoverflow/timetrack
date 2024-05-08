"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function LogOutButton() {
	return (
		<>
			<button
				type="button"
				className="btn btn-circle"
				onClick={() => signOut()}
			>
				<LogOut className="w-6 h-6 text-content2" />
			</button>
		</>
	);
}
