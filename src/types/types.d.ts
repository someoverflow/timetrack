interface Timer {
  id: number;

  user: string;

  start: string;
  startType: string | null;
  end: String | null;
  endType: string | null;

  time: string | null;
  notes: string | null;
  state: string | null;
}
