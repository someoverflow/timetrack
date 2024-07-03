import type { Time } from "@prisma/client";
import {
	useCallback,
	useDebugValue,
	useEffect,
	useReducer,
	useState,
} from "react";
import { toast } from "sonner";
import { getTimePassed } from "../utils";
import { useDebouncedCallback } from "use-debounce";

type stateReducerType = { error: boolean; loading: boolean; running: boolean };
const stateReducer = (
	state: stateReducerType,
	action:
		| { type: "error"; toast?: string | undefined }
		| { type: "loading" | "running"; value: boolean },
): stateReducerType => {
	switch (action.type) {
		case "error":
			toast.error(action.toast ?? "An error occurred while updating", {
				description: "Reloading the page could solve the problem",
			});
			return {
				...state,
				error: true,
			};
		case "loading":
			return {
				...state,
				loading: action.value,
			};
		case "running":
			return {
				...state,
				running: action.value,
			};
		default:
			return {
				...state,
			};
	}
};

const generateTimer = (): Time => {
	return {
		id: "string",
		userId: null,

		start: new Date(),
		startType: "Website",

		end: null,
		endType: null,

		time: null,
		notes: null,
		traveledDistance: null,
		materials: "[]",
		projectName: null,
	};
};

export default function useLiveTimer() {
	const [timer, setTimer] = useState<Time | undefined>(undefined);
	const [state, dispatch] = useReducer(stateReducer, {
		error: false,
		loading: true,

		running: false,
	});

	const fetchLatest = useCallback(async () => {
		const fetchResult: APIResult | undefined = await fetch("/api/times")
			.then((result) => result.json())
			.catch((e) => {
				console.error(e);
				return undefined;
			});
		if (!fetchResult || fetchResult.type !== "ok") {
			dispatch({ type: "error" });
			return;
		}

		const result = fetchResult.result;

		if (result) {
			const start = new Date(result.start);
			const end = result.end ? new Date(result.end) : new Date();

			setTimer({
				...result,
				start: start,
				end: end,
				time: getTimePassed(start, end),
			});
		} else setTimer(undefined);

		dispatch({ type: "running", value: result && !result.end });
		dispatch({ type: "loading", value: false });
	}, []);

	const calculate = useCallback(() => {
		if (!timer || !state.running || state.error) return;

		const startDate = timer.start;
		startDate.setMilliseconds(0);

		const currentDate = new Date();
		currentDate.setMilliseconds(0);

		const timePassed = getTimePassed(startDate, currentDate);

		setTimer({
			...timer,
			start: startDate,
			end: currentDate,
			time: timePassed,
		});
	}, [timer, state]);

	const loading = useDebouncedCallback(() => {
		dispatch({ type: "loading", value: true });
	}, 300);

	const toggle = useCallback(
		async (start: boolean) => {
			loading();

			const tempTimer = generateTimer();
			setTimer(start ? tempTimer : undefined);
			dispatch({ type: "running", value: start });

			const apiResult: APIResult | undefined = await fetch(
				`/api/times/toggle?type=Website&fixTime=${tempTimer.start.toISOString()}`,
				{
					method: "PUT",
				},
			)
				.then((result) => result.json())
				.catch((e) => {
					console.error(e);
					return undefined;
				});
			if (!apiResult) {
				dispatch({
					type: "error",
					toast: `An error occurred while ${start ? "starting" : "stopping"}`,
				});
				return;
			}

			loading.cancel();
			dispatch({ type: "loading", value: false });
			fetchLatest();
		},
		[fetchLatest, loading],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Only run once
	useEffect(() => {
		fetchLatest();
	}, []);

	// Calculation Interval
	useEffect(() => {
		const intervalId = setInterval(() => {
			if (!state.error && state.running) calculate();
		}, 250);
		return () => clearInterval(intervalId);
	}, [state.error, state.running, calculate]);

	// Fetch Interval
	useEffect(() => {
		const intervalId = setInterval(() => {
			if (!state.error) {
				fetchLatest();
				console.log("fetch", "new data");
			}
		}, 30 * 1000);
		return () => clearInterval(intervalId);
	}, [state.error, fetchLatest]);

	useDebugValue(timer);
	useDebugValue(state);

	return { timer, state, toggle };
}