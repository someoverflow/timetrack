interface Timer {
  id: string;

  user: string;

  start: string;
  startType: string | null;
  end: string | null;
  endType: string | null;

  time: string | null;
  notes: string | null;

  state: string | null;
}

type TicketUsers = { name: string | null; username: string }[];
type Users = {
  single: { name: string | null; username: string }[];
  grouped: Partial<
    Record<
      string,
      {
        name: string | null;
        username: string;
      }[]
    >
  >;
};

type TicketPagePayload = {
  include: {
    uploads: {
      include: {
        creator: {
          select: {
            name: true;
            username: true;
            id: true;
          };
        };
      };
    };
    assignees: {
      select: {
        id: true;
        username: true;
        name: true;
      };
    };
    creator: {
      select: {
        id: true;
        username: true;
        name: true;
      };
    };
    projects: {
      select: {
        name: true;
      };
    };
  };
};

type Projects = {
  single: {
    name: string;
    customerName: string | null;
  }[];
  grouped: Partial<
    Record<
      string,
      {
        name: string;
        customerName: string | null;
      }[]
    >
  >;
};

type APIResultType =
  | "unknown"
  // No Success
  | "validation"
  | "json-parsing"
  | "error-message"
  | "not-found"
  | "duplicate-found"
  // Success
  | "ok"
  | "deleted"
  | "created"
  | "updated";

type ErrorResultType =
  | "unknown"
  | "error-message"
  | "duplicate-found"
  | "not-found"
  | "json-parsing";

type APIResult = {
  success: boolean;
  status: number;
} & (
  | {
      type: "unknown" | "ok" | "deleted" | "created" | "updated";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result?: any; // Keep this flexible for success scenarios
    }
  | {
      type: "validation";
      result?: ZodIssue[];
    }
  | {
      type: ErrorResultType;
      // Allow string or object for errors
      result?: { message: string; [key: string]: unknown };
    }
);
