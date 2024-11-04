import { useTranslations } from "next-intl";
import { useCallback, useReducer } from "react";
import { toast } from "sonner";

type stateReducerType = { error: boolean; loading: boolean };
const statusReducer = (
  state: stateReducerType,
  action:
    | { type: "reset_error" }
    | { type: "error"; toast?: string | undefined }
    | { type: "loading" | "running"; value: boolean },
) => {
  switch (action.type) {
    case "error":
      toast.error(action.toast ?? "An error occurred while updating", {
        description: "Reloading the page could solve the problem",
      });
      return {
        ...state,
        error: true,
      };
    case "reset_error":
      return {
        ...state,
        error: false,
      };
    case "loading":
      return {
        ...state,
        loading: action.value,
      };
    default:
      return {
        ...state,
      };
  }
};

export default function useRequest<T extends object>(
  request: (passed?: T) => Promise<Response>,
  successFn: (result: APIResult) => Promise<void> | void,
  errorFn?: (
    result: APIResult,
    type: APIResultType,
  ) => Promise<boolean> | boolean,
) {
  const t = useTranslations("Error");
  const [status, dispatch] = useReducer(statusReducer, {
    error: false,
    loading: false,
  });

  const send = useCallback(
    async (passToRequest?: T) => {
      dispatch({ type: "loading", value: true });

      const result: APIResult = await (await request(passToRequest))
        .json()
        .catch(() => {
          toast.error(t("message"), {
            description: t("resultProcessing"),
            duration: 8_000,
          });
          return;
        });

      dispatch({ type: "loading", value: false });

      if (result.success) {
        await successFn(result);
        return;
      }

      if (typeof errorFn !== "undefined") {
        const fnResult = await errorFn(result, result.type);
        if (fnResult) return;
      }

      const typeString = `(${result.type.replaceAll("_", "-")})`;

      switch (result.type) {
        case "validation": {
          const issueArray = result.result;
          if (!issueArray) throw new Error("Wrong result");
          for (const issue of issueArray) {
            toast.warning(
              t("validation.message", {
                code: issue.code,
                message: issue.message,
              }),
              {
                description: t("validation.description", {
                  code: issue.code,
                  message: issue.message,
                }),
                duration: 10_000,
              },
            );
          }
          break;
        }
        case "error-message":
        case "duplicate-found":
          toast.warning(result.result?.message, {
            duration: 5_000,
          });
          break;
        default:
          toast.error(
            t("unknown.message", {
              type: typeString === "(undefined)" ? "" : typeString,
            }),
            {
              description: "Error could not be identified. You can try again.",
              duration: 8_000,
            },
          );
          break;
      }
    },
    [request, successFn, errorFn, t],
  );

  return { status, send };
}
