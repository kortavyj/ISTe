const knownMessages = [
  {
    pattern: /invalid login credentials/i,
    message: "Неверная электронная почта или пароль.",
  },
  {
    pattern: /email not confirmed/i,
    message: "Сначала подтвердите электронную почту.",
  },
  {
    pattern: /user already registered/i,
    message: "Аккаунт с такой электронной почтой уже существует.",
  },
  {
    pattern: /password should be at least/i,
    message: "Пароль не соответствует минимальным требованиям.",
  },
  {
    pattern: /email rate limit exceeded/i,
    message:
      "Слишком много писем. Подождите несколько минут и повторите попытку.",
  },
  {
    pattern: /over_email_send_rate_limit/i,
    message:
      "Слишком много писем. Подождите несколько минут и повторите попытку.",
  },
  {
    pattern: /duplicate key value/i,
    message: "Этот никнейм уже занят.",
  },
  {
    pattern: /profiles_username_lower_unique_idx/i,
    message: "Этот никнейм уже занят.",
  },
  {
    pattern: /network/i,
    message: "Не удалось связаться с сервером. Проверьте интернет.",
  },
];

export function getAuthErrorMessage(error) {
  const source = error?.message ?? String(error ?? "");

  const match = knownMessages.find(({ pattern }) => pattern.test(source));

  return match?.message ?? "Произошла ошибка. Повторите попытку.";
}
