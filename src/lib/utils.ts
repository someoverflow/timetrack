export function getTimePassed(start: Date, end: Date): string {
  var msPassed = Math.abs(start.getTime() - end.getTime());
  const date = new Date(Date.UTC(0, 0, 0, 0, 0, 0, msPassed));
  const timePassed = [
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  ]
    .map((s) => String(s).padStart(2, "0"))
    .join(":");
  return timePassed;
}

export function getTotalTime(times: string[]): string {
  const totalSeconds = times.reduce((total, timeString) => {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return total + hours * 3600 + minutes * 60 + seconds;
  }, 0);

  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  const totalMonthTime = `${totalHours
    .toString()
    .padStart(2, "0")}:${totalMinutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;

  return totalMonthTime;
}
