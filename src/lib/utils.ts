import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validatePassword(password: string): boolean {
  const regex = /^(?=.*[0-9])[a-zA-Z0-9]{8,20}$/;
  return regex.test(password);
}

export function getTimePassed(start: Date, end: Date): string {
  let msPassed = Math.abs(start.getTime() - end.getTime());
  const date = new Date(Date.UTC(0, 0, 0, 0, 0, 0, msPassed));
  return [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
    .map((s) => String(s).padStart(2, "0"))
    .join(":");
}

export function getTotalTime(times: string[]): string {
  const totalSeconds = times.reduce((total, timeString) => {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return total + hours * 3600 + minutes * 60 + seconds;
  }, 0);

  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${totalHours.toString().padStart(2, "0")}:${totalMinutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}