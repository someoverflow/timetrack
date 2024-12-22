import { type NextRequest, NextResponse } from "next/server";
import { authCheck, type userData } from "./auth";

export const createErrorResponse = (
  status: number,
  message: string,
  type: APIResultType = "unknown",
  result?: any,
) => {
  const errorResult: APIResult = {
    success: false,
    status,
    type,
    result: result ?? { message },
  };
  return NextResponse.json(errorResult, {
    status: status,
    statusText: message,
  });
};

export const NO_AUTH_RESPONSE = createErrorResponse(401, "Not authenticated");
export const FORBIDDEN_RESPONSE = createErrorResponse(403, "Forbidden");
export const NOT_ADMIN_RESPONSE = createErrorResponse(403, "Forbidden");

export const badRequestResponse = (
  result: unknown,
  type: APIResultType = "unknown",
) => createErrorResponse(400, "Bad Request", type, result);

export const defaultResult = (
  type: APIResultType = "unknown",
  status = 200,
): APIResult => ({
  success: true,
  status,
  type,
});

//#region API
type ApiConfig = {
  verifySession: boolean;
  allowCustomers: boolean;
  adminOnly: boolean;
  parseJson: boolean;
};
const defaultApiConfig: ApiConfig = {
  adminOnly: false,
  allowCustomers: false,
  parseJson: true,
  verifySession: true,
};

type UserData = Awaited<ReturnType<typeof userData>>;

export const api = (
  fun: (
    request: NextRequest,
    user?: UserData,
    json?: any,
  ) => Promise<NextResponse> | NextResponse,
  c?: Partial<ApiConfig>,
) => {
  return async (req: NextRequest) => {
    const config: ApiConfig = { ...defaultApiConfig, ...c };

    let userResult: UserData | undefined;
    let jsonResult: any;

    // Session verification
    if (config.verifySession) {
      const auth = await authCheck();

      if (!auth.data.session || !auth.user) return NO_AUTH_RESPONSE;

      if (config.adminOnly && auth.user.role !== "ADMIN") {
        return NOT_ADMIN_RESPONSE;
      }

      if (!config.allowCustomers && auth.user.role === "CUSTOMER") {
        return FORBIDDEN_RESPONSE;
      }

      userResult = auth.user;
    }

    // JSON-Parsing
    if (config.parseJson) {
      try {
        jsonResult = await req.json();
      } catch (error) {
        console.debug("JSON parsing error:", (error as Error).message);
        return badRequestResponse(
          { message: "JSON Body could not be parsed" },
          "json-parsing",
        );
      }
    }

    return await fun(req, userResult, jsonResult);
  };
};
//#endregion
