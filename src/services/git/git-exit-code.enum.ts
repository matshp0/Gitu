export enum GitExitCode {
  SUCCESS = 0,

  // Generic failure (most common)
  ERROR = 1,

  // Misuse of shell / invalid arguments
  MISUSAGE = 2,

  // Command invoked cannot execute (permissions, etc.)
  CANNOT_EXECUTE = 126,

  // Command not found
  NOT_FOUND = 127,

  // Invalid exit argument
  INVALID_EXIT = 128,

  // Fatal error in Git (e.g. repo not found, bad revision)
  FATAL = 128,

  // Interrupted (Ctrl+C)
  SIGINT = 130,

  // Terminated
  SIGTERM = 143,
}
