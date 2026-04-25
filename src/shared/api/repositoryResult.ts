export type RepositorySuccess<T> = {
  data: T
  error: null
}

export type RepositoryFailure = {
  data: null
  error: string
}

export type RepositoryResult<T> = RepositorySuccess<T> | RepositoryFailure

export function repositorySuccess<T>(data: T): RepositorySuccess<T> {
  return { data, error: null }
}

export function repositoryFailure(error: string): RepositoryFailure {
  return { data: null, error }
}

export function getRepositoryErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message
  }

  return "Не удалось выполнить запрос к базе данных."
}
