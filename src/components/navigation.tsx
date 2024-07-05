//#region Imports
import NavigationSection from "./navigation-section";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
//#endregion

export default async function Navigation({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	if (!session) return redirect("/signin");
	const user = session.user;

	return (
		<main>
			{children}

			<section className="fixed left-1/2 -translate-x-1/2 bottom-[1svh] p-4">
				<div className="flex flex-row items-center justify-center">
					<NavigationSection user={user} />
				</div>
			</section>
		</main>
	);
}
