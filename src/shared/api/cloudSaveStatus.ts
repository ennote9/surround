export type CloudSaveState =
  | { status: "idle"; error: null }
  | { status: "saving"; error: null }
  | { status: "saved"; error: null; savedAt: string }
  | { status: "error"; error: string }
