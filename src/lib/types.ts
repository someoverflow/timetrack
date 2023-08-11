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

interface UserMinimal {
  id: number;
  name: string;
  username: string;
}

interface ChipDetails {
  id: string;
  user: {
    id: number;
    username: string;
    email: string;
    password: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
  updatedAt: Date;
  createdAt: Date;
}

interface UserDetails {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  chips: {
    id: string;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
  updatedAt: Date;
  createdAt: Date;
}

interface ErrorDetails {
  type: "error" | "warning";
  title: string;
  content: string;
}

interface APIResult {
  success: boolean;
  status: number;
  result: any;
}
