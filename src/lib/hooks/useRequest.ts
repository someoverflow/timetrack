import { useTranslations } from "next-intl";
import { useCallback, useReducer } from "react";
import { type ExternalToast, toast } from "sonner";
import type { ZodIssue } from "zod/lib/ZodError";

type processError = {
	toast?: { message: string; data: ExternalToast | undefined } | undefined;
	setStatusError?: undefined | true;
};

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
	successFn: (result: APIResult) => Promise<void> | void | processError,
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
						important: true,
						duration: 8_000,
					});
					return;
				});

			dispatch({ type: "loading", value: false });

			if (result.success) {
				const processResult = await successFn(result);
				if (processResult) {
					if (processResult.toast)
						toast(processResult.toast.message, processResult.toast.data);
					if (processResult.setStatusError === true)
						dispatch({ type: "error" });
				}
				return;
			}

			const typeString = `(${result.type.replaceAll("_", "-")})`;

			switch (result.type) {
				case "validation": {
					const issueArray: ZodIssue[] = result.result;
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
								important: true,
								duration: 10_000,
							},
						);
					}
					break;
				}
				case "error-message":
				case "duplicate-found":
					toast.warning(result.result.message, {
						important: true,
						duration: 5_000,
					});
					break;
				default:
					toast.error(
						t("unknown.message", {
							type: typeString === "undefined" ? "" : typeString,
						}),
						{
							description: "Error could not be identified. You can try again.",
							important: true,
							duration: 8_000,
						},
					);
					break;
			}
		},
		[request, successFn, t],
	);

	return { status, send };
}
