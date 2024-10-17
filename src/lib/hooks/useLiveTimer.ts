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
        duration: Infinity,
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

const generateTimer = (project: string | undefined): Time => {
  return {
    id: "string",
    userId: null,

    breakTime: 0,

    start: new Date(),
    startType: "Website",

    end: null,
    endType: null,

    invoiced: false,
    time: null,
    notes: null,
    traveledDistance: null,
    materials: "[]",
    projectName: project ?? null,
  };
};

export default function useLiveTimer({ projects }: { projects: Projects }) {
  const [timer, setTimer] = useState<Time | undefined>(undefined);
  const [project, setProject] = useState<string | undefined>(undefined);
  const [state, dispatch] = useReducer(stateReducer, {
    error: false,
    loading: true,

    running: false,
  });

  const debouncedLoading = useDebouncedCallback(() => {
    dispatch({ type: "loading", value: true });
  }, 500);

  const fetchLatest = useCallback(async () => {
    if (state.error) return;

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
      setProject(result.projectName);

      if (result.projectName)
        localStorage.setItem("lastProject", result.projectName);
      else localStorage.removeItem("lastProject");
    } else {
      setTimer(undefined);

      const lastProject = localStorage.getItem("lastProject");
      if (
        projects.single.find((project) => project?.name === lastProject) !==
          undefined &&
        lastProject
      )
        setProject(lastProject);
    }

    dispatch({ type: "running", value: result && !result.end });
    dispatch({ type: "loading", value: false });
  }, [projects.single, state.error]);

  const calculate = useCallback(() => {
    if (!timer || !state.running || state.error) return;

    const startDate = timer.start;
    startDate.setMilliseconds(0);

    const currentDate = new Date();
    currentDate.setMilliseconds(0);

    const timePassed =
      getTimePassed(startDate, currentDate, timer.breakTime) ?? null;

    setTimer({
      ...timer,
      start: startDate,
      end: currentDate,
      time: timePassed,
    });
  }, [timer, state]);

  const toggle = useCallback(
    async (start: boolean) => {
      debouncedLoading();

      const tempTimer = generateTimer(project);
      setTimer(start ? tempTimer : undefined);
      dispatch({ type: "running", value: start });

      const projectString = project ? `&project=${project}` : "";
      const apiResult: APIResult | undefined = await fetch(
        `/api/times/toggle?type=Website&fixTime=${tempTimer.start.toISOString()}${projectString}`,
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

      debouncedLoading.cancel();
      dispatch({ type: "loading", value: false });
      fetchLatest();
    },
    [debouncedLoading, project, fetchLatest],
  );

  const changeProject = useCallback(
    async (project: string | undefined) => {
      if (state.running && !state.loading && timer?.id !== "string") {
        debouncedLoading();

        const result: APIResult | undefined = await fetch("/api/times", {
          method: "PUT",
          body: JSON.stringify({
            id: timer?.id,
            project: project ?? null,
          }),
        })
          .then((result) => result.json())
          .catch(() => {
            return undefined;
          });

        if (!result) {
          dispatch({
            type: "error",
            toast: "An error occurred while changing the project",
          });
          return;
        }

        toast.success("Successfully changed project", {
          duration: 3000,
        });

        debouncedLoading.cancel();
        dispatch({ type: "loading", value: false });
        fetchLatest();
      }

      if (project) localStorage.setItem("lastProject", project);
      else localStorage.removeItem("lastProject");

      setProject(project);
    },
    [state.running, state.loading, timer?.id, debouncedLoading, fetchLatest],
  );

  useEffect(() => {
    fetchLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useDebugValue(state);
  useDebugValue(timer);

  return { timer, state, project, changeProject, toggle };
}
