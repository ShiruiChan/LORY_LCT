const TelegramBot = require('node-telegram-bot-api');

/*
 * Simple Telegram bot to deliver a Login URL button.
 *
 * Usage:
 *   1. Install dependencies with `npm install node-telegram-bot-api` in the `bot` folder.
 *   2. Define environment variables TELEGRAM_BOT_TOKEN (your bot token) and DOMAIN (your site domain).
 *      The DOMAIN should match the domain you set via /setdomain in @BotFather, for example:
 *        export TELEGRAM_BOT_TOKEN=123456:ABC
 *        export DOMAIN=https://your-domain.com
 *   3. Run the bot with `node index.js`.
 *
 * When a user sends /login to your bot, they will receive a message with a Login button.
 * When they tap the button from within Telegram, Telegram will open the URL
 * `${DOMAIN}/telegram-login` and append the user data (id, first_name, etc.)
 * in the query string along with a `hash` value. Your frontend page at
 * `/telegram-login` should parse these parameters, verify the `hash` and
 * create a user session if valid.
 */

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable is not set.');
}

const domain = process.env.DOMAIN || 'https://example.com';

// Enable polling so the bot can receive messages. In production you may prefer webhooks.
const bot = new TelegramBot(token, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'Привет! Нажмите /login, чтобы получить ссылку для входа через Telegram.\n\n' +
      'If you have any questions, contact the developer.'
  );
});

// Handle /login command
bot.onText(/\/login/, (msg) => {
  const loginUrl = `${domain}/telegram-login`;
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: 'Войти через веб',
          // Using login_url ensures Telegram will append user data and hash when opening the URL.
          login_url: {
            url: loginUrl,
            request_write_access: false,
          },
        },
      ],
    ],
  };
  bot.sendMessage(
    msg.chat.id,
    'Нажмите кнопку ниже, чтобы авторизоваться на сайте. После входа вы сможете вернуться в игру.',
    { reply_markup: replyMarkup }
  );
});