import { getRequestConfig } from "next-intl/server";
import prisma from "./lib/prisma";

export default getRequestConfig(async () => {
  let locale = "en";

  /**
	 * const session = await auth();
	if (session) {
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { language: true },
		});
		if (user) locale = user.language;
	}
	 */

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
