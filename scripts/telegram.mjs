export async function notify(text, env = process.env, send = fetch) {
  const { TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, GITHUB_ACTIONS } = env
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    if (GITHUB_ACTIONS === 'true') throw new Error('Задайте оба секрета Telegram в GitHub Actions')
    console.log('Секреты Telegram не заданы, сообщение не отправлено')
    return
  }

  let response
  try {
    response = await send('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        link_preview_options: { is_disabled: true },
      }),
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new Error('Telegram недоступен или превысил время ожидания')
  }
  if (!response.ok) throw new Error('Telegram ответил HTTP ' + response.status)
  if (!(await response.json().catch(() => null))?.ok) throw new Error('Telegram не подтвердил отправку')
  console.log('Telegram: ' + response.status)
}
