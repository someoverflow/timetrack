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

interface TimerWithDate {
  id: number;

  user: string;

  start: Date;
  startType: string | null;
  end: Date | null;
  endType: string | null;

  time: string | null;
  notes: string | null;
}

interface APIResult {
  success: boolean;
  status: number;
  result: any;
}
