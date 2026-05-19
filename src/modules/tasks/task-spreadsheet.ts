export const TASK_SPREADSHEET_HEADERS = [
  "Date",
  "Task",
  "Topic",
  "Description",
  "Priority",
  "Minutes",
  "Status",
] as const;

export const TASK_SPREADSHEET_REQUIRED_HEADERS = TASK_SPREADSHEET_HEADERS;

export const TASK_SPREADSHEET_ACCEPT = ".xlsx,.xls,.csv";

export const TASK_SPREADSHEET_HELP_TEXT =
  "Required headers: Date, Task, Topic, Description, Priority, Minutes, Status.";
