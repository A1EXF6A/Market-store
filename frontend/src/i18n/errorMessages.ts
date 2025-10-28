const MESSAGES = {
  es: {
    INVALID_CREDENTIALS: "Credenciales inválidas",
    USER_NOT_FOUND: "Usuario no encontrado",
    ACCOUNT_SUSPENDED: "Tu cuenta está suspendida",
    ACCOUNT_BANNED: "Tu cuenta ha sido baneada permanentemente",
  },
  en: {
    INVALID_CREDENTIALS: "Invalid credentials",
    USER_NOT_FOUND: "User not found",
    ACCOUNT_SUSPENDED: "Your account is suspended",
    ACCOUNT_BANNED: "Your account has been permanently banned",
  },
} as const;

type Locale = keyof typeof MESSAGES;
type ErrorCode = keyof (typeof MESSAGES)[Locale];

const DEFAULT_LOCALE: Locale = "es";
const DEFAULT_MESSAGE = "Unknown error";

const getErrorMessage = (
  code: string,
  locale: Locale = DEFAULT_LOCALE,
): string => {
  const messages = MESSAGES[locale];
  return messages[code as ErrorCode] || DEFAULT_MESSAGE;
};

export default getErrorMessage;
