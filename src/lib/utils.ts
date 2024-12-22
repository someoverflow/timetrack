import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: Date): string => {
  return date.toLocaleString("sv").replace(" ", "T");
};

export function getTimePassed(
  start: Date,
  end: Date,
  breakTime?: number,
): string | undefined {
  // Calculation of elapsed milliseconds
  const msPassed = end.getTime() - start.getTime();
  const totalSeconds = Math.floor(msPassed / 1000);

  // Subtract the break time (in seconds) if specified
  const breakSeconds = breakTime ? breakTime * 60 : 0;
  const adjustedTotalSeconds = totalSeconds - breakSeconds;

  // Check if the result is negative
  if (adjustedTotalSeconds < 0) return undefined;

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(adjustedTotalSeconds / 3600);
  const minutes = Math.floor((adjustedTotalSeconds % 3600) / 60);
  const seconds = Math.round(adjustedTotalSeconds % 60);

  // Format as "HH:MM:SS"
  return [hours, minutes, seconds]
    .map((unit) => unit.toString().padStart(2, "0"))
    .join(":");
}

export function sumTimes(times: string[]): string {
  const totalSeconds = times.reduce((total, timeString) => {
    // Split the time string into hours, minutes, and seconds
    const [hoursStr, minutesStr, secondsStr] = timeString.split(":");

    // Convert to numbers, or set to 0 if undefined
    const hours = Number(hoursStr) || 0;
    const minutes = Number(minutesStr) || 0;
    const seconds = Number(secondsStr) || 0;

    // Calculate the total seconds
    return total + hours * 3600 + minutes * 60 + seconds;
  }, 0);

  // Calculate hours, minutes, and seconds from totalSeconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Return the result in the format HH:MM:SS
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function humanFileSize(size: bigint): string {
  if (size < 1024n) return size + " B"; // Use 1024n for bigint comparison

  // Convert bigint to a number for calculations
  const sizeNumber = Number(size);
  const i = Math.floor(Math.log(sizeNumber) / Math.log(1024));
  const num = sizeNumber / Math.pow(1024, i);

  // Rounding based on the value of num
  const rounded = Math.round(num);
  const formattedNum =
    rounded < 10 ? num.toFixed(2) : rounded < 100 ? num.toFixed(1) : rounded;

  // Select unit
  const unit = "KMGTPEZY"[i - 1] + "B";
  return `${formattedNum} ${unit}`;
}

export const formatDuration = (
  ms: number,
  config?: Partial<{
    d: boolean;
    h: boolean;
    min: boolean;
    s: boolean;
    ms: boolean;
  }>,
) => {
  config = { d: true, h: true, min: true, s: true, ms: true, ...config };
  if (ms < 0) ms = -ms;
  const time = {
    d: config.d ? Math.floor(ms / 86400000) : 0,
    h: config.h ? Math.floor(ms / 3600000) % 24 : 0,
    min: config.min ? Math.floor(ms / 60000) % 60 : 0,
    s: config.s ? Math.floor(ms / 1000) % 60 : 0,
    ms: config.ms ? Math.floor(ms) % 1000 : 0,
  };
  return Object.entries(time)
    .filter((val) => val[1] !== 0 || val[0] == "s")
    .map(([key, val]) => `${val}${key}`)
    .join(" ");
};
