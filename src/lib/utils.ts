import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
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

export function validatePassword(password: string): boolean {
  const regex = /^(?=.*[0-9])[a-zA-Z0-9]{8,20}$/;
  return regex.test(password);
}

export function getTimePassed(start: Date, end: Date): string {
  const msPassed = Math.abs(start.getTime() - end.getTime());
  const totalSeconds = Math.floor(msPassed / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((unit) => unit.toString().padStart(2, "0"))
    .join(":");
}

export function sumTimes(times: string[]): string {
  const totalSeconds = times.reduce((total, timeString) => {
    let [hours, minutes, seconds] = timeString.split(":").map(Number);
    if (!hours) hours = 0;
    if (!minutes) minutes = 0;
    if (!seconds) seconds = 0;
    return total + hours * 3600 + minutes * 60 + seconds;
  }, 0);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
