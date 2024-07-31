import { getRequestConfig } from "next-intl/server";
import { authCheck } from "./lib/auth";
import { headers as nextHeaders } from "next/headers";
import Negotiator from "negotiator";

export default getRequestConfig(async () => {
  let locale = "en";

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
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
