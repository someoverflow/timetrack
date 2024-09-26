/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { type Role } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { authCheck } from "./auth";

//#region Results
const NO_AUTH: APIResult = {
  success: false,
  status: 401,
  type: "unknown",
  result: "Not authenticated",
};
const NOT_ADMIN: APIResult = {
  success: false,
  status: 403,
  type: "unknown",
  result: "Forbidden",
};
const BAD_REQUEST: APIResult = {
  success: false,
  status: 400,
  type: "unknown",
  result: "Bad Request",
};
const FORBIDDEN: APIResult = {
  success: false,
  status: 403,
  type: "unknown",
  result: "Forbidden",
};
//#endregion
//#region Responses
export const NO_AUTH_RESPONSE = NextResponse.json(NO_AUTH, {
  status: NO_AUTH.status,
  statusText: NO_AUTH.result,
});

export const NOT_ADMIN_RESPONSE = NextResponse.json(NOT_ADMIN, {
  status: NOT_ADMIN.status,
  statusText: NOT_ADMIN.result,
});
export const FORBIDDEN_RESPONSE = NextResponse.json(FORBIDDEN, {
  status: FORBIDDEN.status,
  statusText: FORBIDDEN.result,
});
//#endregion

export const defaultResult = (
  type?: APIResultType,
  status?: number,
): APIResult => {
  return {
    success: true,
    status: status ?? 200,
    type: type ?? "unknown",
  };
};

export const badRequestResponse = (result: unknown, type?: APIResultType) => {
  return NextResponse.json(
    { ...BAD_REQUEST, type: type ?? "unknown", result: result },
    {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    },
  );
};

type ApiConfig = {
  verifySession: boolean;
  allowCustomers: boolean;
  adminOnly: boolean;
  parseJson: boolean;
};

const defaultApiConfig = {
  adminOnly: false,
  allowCustomers: false,
  parseJson: true,
  verifySession: true,
} satisfies ApiConfig;

export const api = (
  fun: (
    request: NextRequest,
    user?: {
      name: string | null;
      id: string;
      username: string;
      role: Role;
      language: string;
      email: string | null;
      ticketCreationMail: boolean;
    },
    json?: any,
  ) => Promise<NextResponse> | NextResponse,
  c?: Partial<ApiConfig>,
) => {
  return async (req: NextRequest) => {
    let userResult = undefined;
    let jsonResult = undefined;

    const config = c ?? defaultApiConfig;

    if (config.parseJson ?? defaultApiConfig.parseJson) {
      try {
        jsonResult = await req.json();
      } catch (e) {
        console.debug(e);
        return badRequestResponse(
          { message: "JSON Body could not be parsed" },
          "json-parsing",
        );
      }
    }

    if (config.verifySession ?? defaultApiConfig.verifySession) {
      const auth = await authCheck();

      if (!auth.data.session || !auth.user) return NO_AUTH_RESPONSE;

      if (
        (config.adminOnly ?? defaultApiConfig.adminOnly) &&
        auth.user.role !== "ADMIN"
      )
        return NOT_ADMIN_RESPONSE;

      if (
        !(config.allowCustomers ?? defaultApiConfig.allowCustomers) &&
        auth.user.role === "CUSTOMER"
      )
        return FORBIDDEN_RESPONSE;

      userResult = auth.user;
    }

    return await fun(req, userResult, jsonResult);
  };
};
