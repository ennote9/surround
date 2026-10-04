import type { AuthError } from "@supabase/supabase-js"

type AuthOperation =
  | "session"
  | "signIn"
  | "signUp"
  | "passwordReset"
  | "passwordUpdate"
  | "signOut"

const fallbackMessages: Record<AuthOperation, string> = {
  session: "Не удалось проверить сессию. Обновите страницу.",
  signIn: "Не удалось войти. Попробуйте ещё раз.",
  signUp: "Не удалось создать аккаунт. Попробуйте ещё раз.",
  passwordReset: "Не удалось отправить письмо для восстановления пароля. Попробуйте ещё раз.",
  passwordUpdate: "Не удалось изменить пароль. Попробуйте ещё раз.",
  signOut: "Не удалось выйти из аккаунта. Попробуйте ещё раз.",
}

const sessionMessage = "Сессия недействительна или истекла. Войдите снова."
const linkMessage = "Ссылка или код для входа или восстановления недействительны или устарели."
const passwordMessage = "Используйте более длинный и сложный пароль."
const rateLimitMessage = "Слишком много попыток. Попробуйте немного позже."
const temporaryMessage = "Сервис временно недоступен. Попробуйте немного позже."

// Codes verified against the installed @supabase/auth-js library.
const codeMessages: Readonly<Record<string, string>> = {
  invalid_credentials: "Неверный email или пароль.",
  email_not_confirmed: "Подтвердите email перед входом.",
  email_exists: "Аккаунт с таким email уже существует.",
  user_already_exists: "Аккаунт с таким email уже существует.",
  email_address_invalid: "Проверьте правильность email или используйте другой адрес.",
  email_address_not_authorized: "На этот email пока нельзя отправить письмо. Используйте другой адрес.",
  weak_password: passwordMessage,
  same_password: "Новый пароль должен отличаться от текущего.",
  over_request_rate_limit: rateLimitMessage,
  over_email_send_rate_limit: rateLimitMessage,
  over_sms_send_rate_limit: rateLimitMessage,
  otp_expired: linkMessage,
  flow_state_expired: linkMessage,
  flow_state_not_found: linkMessage,
  bad_code_verifier: linkMessage,
  pkce_code_verifier_not_found: "Откройте ссылку в том же браузере, где запросили её, или запросите новую.",
  bad_jwt: sessionMessage,
  invalid_jwt: sessionMessage,
  session_expired: sessionMessage,
  session_not_found: sessionMessage,
  refresh_token_not_found: sessionMessage,
  refresh_token_already_used: sessionMessage,
  reauthentication_needed: "Войдите снова перед изменением пароля.",
  reauthentication_not_valid: "Подтверждение входа недействительно. Войдите снова.",
  user_not_found: "Аккаунт не найден. Проверьте email.",
  user_banned: "Доступ к аккаунту ограничен.",
  signup_disabled: "Регистрация временно недоступна.",
  email_provider_disabled: "Вход и регистрация по email временно недоступны.",
  request_timeout: temporaryMessage,
  hook_timeout: temporaryMessage,
  hook_timeout_after_retry: temporaryMessage,
}

// Older server responses may omit code. Match only recognized patterns;
// never return the original message, even when it is already in Russian.
const legacyMessages: ReadonlyArray<readonly [RegExp, string]> = [
  [/invalid (?:login )?credentials|email or password is incorrect/i, codeMessages.invalid_credentials],
  [/email (?:is )?not confirmed/i, codeMessages.email_not_confirmed],
  [/(?:user|email|account) already (?:registered|exists)/i, codeMessages.email_exists],
  [/invalid email|email.*(?:invalid|not valid)/i, "Проверьте правильность email."],
  [/password.*(?:too short|too weak|at least|invalid|not valid)|weak password/i, passwordMessage],
  [/new password.*different|same password/i, codeMessages.same_password],
  [/rate.?limit|too many (?:requests|attempts)|email.*seconds/i, rateLimitMessage],
  [/(?:session|refresh token|jwt).*(?:expired|invalid|not found|missing|already used)/i, sessionMessage],
  [/(?:otp|token|recovery link|email link).*(?:expired|invalid)|(?:expired|invalid).*(?:otp|token|recovery link|email link)/i, linkMessage],
  [/user not found/i, codeMessages.user_not_found],
  [/failed to fetch|fetch failed|network request failed|networkerror/i, "Не удалось подключиться. Проверьте интернет и попробуйте ещё раз."],
  [/request timed? out|request timeout/i, temporaryMessage],
]

export function getAuthErrorMessage(error: unknown, operation: AuthOperation): string {
  const details = (typeof error === "object" && error !== null ? error : {}) as
    Partial<Pick<AuthError, "code" | "name" | "message" | "status">>
  const code = typeof details.code === "string" ? details.code : undefined

  if (code && Object.hasOwn(codeMessages, code)) {
    return codeMessages[code]
  }
  if (details.status === 429) return rateLimitMessage
  if (typeof details.status === "number" && details.status >= 500) {
    return temporaryMessage
  }
  if (details.name === "AuthSessionMissingError") return sessionMessage
  if (details.name === "AuthInvalidCredentialsError") return codeMessages.invalid_credentials
  if (details.name === "AuthRetryableFetchError") return temporaryMessage

  if ((!code || code === "validation_failed") && typeof details.message === "string") {
    for (const [pattern, message] of legacyMessages) {
      if (pattern.test(details.message)) return message
    }
  }
  return fallbackMessages[operation]
}
