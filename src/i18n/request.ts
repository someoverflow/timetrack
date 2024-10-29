import { getRequestConfig } from "next-intl/server";
import { headers as nextHeaders } from "next/headers";
import Negotiator from "negotiator";
import { authCheck } from "@/lib/auth";

export default getRequestConfig(async () => {
  let locale = process.env.DEFAULT_LANG ?? "de";

  const auth = await authCheck();
  if (auth.user) locale = auth.user.language;
  else {
    const languages = new Negotiator({
      headers: {
        "accept-language": nextHeaders().get("accept-language") ?? undefined,
      },
    }).languages();

    if (languages.length !== 0) {
      for (const lang of languages) {
        if (["de", "en"].includes(lang.toLowerCase())) {
          locale = lang;
          break;
        }
      }
    }
  }

  return {
    locale,
    messages: (await import(`@/../messages/${locale}.json`)).default,
  };
});
