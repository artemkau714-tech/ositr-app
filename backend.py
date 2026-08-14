import asyncio
import json
from aiogram import Bot, Dispatcher, types
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from telethon import TelegramClient

# ========== КОНФИГ ==========
BOT_TOKEN = "YOUR_BOT_TOKEN"
API_ID = 12345
API_HASH = "your_api_hash"
PHONE = "+7XXXXXXXXXX"
# =============================

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

telethon_client = TelegramClient('session', API_ID, API_HASH)

# Подключаем наш OSINT-класс (см. предыдущие сообщения)
from telegram_osint import DeepOSINT

@dp.message_handler(commands=['start'])
async def start(message: types.Message):
    await message.answer(
        "🔍 Нажми кнопку, чтобы открыть OSINT Mini App",
        reply_markup=InlineKeyboardMarkup().add(
            InlineKeyboardButton(
                text="Открыть панель",
                web_app=WebAppInfo(url="https://ТВОЙ_ХОСТИНГ/index.html")
            )
        )
    )

@dp.message_handler(content_types=types.ContentType.WEB_APP_DATA)
async def handle_webapp_data(message: types.Message):
    data = json.loads(message.web_app_data.data)
    username = data.get('username')

    # Запускаем OSINT
    osint = DeepOSINT(telethon_client)
    profile = await osint.full_profile(username)

    # Отправляем результат обратно в Mini App (через callback или сообщение)
    # В Mini App ответ можно получить через tg.sendData или через сообщение в чат
    await message.answer(
        f"✅ Досье на @{username} готово!\n{json.dumps(profile, indent=2, ensure_ascii=False)[:1000]}...",
        reply_markup=InlineKeyboardMarkup().add(
            InlineKeyboardButton(
                text="📊 Смотреть в Mini App",
                web_app=WebAppInfo(url=f"https://ТВОЙ_ХОСТИНГ/report.html?data={json.dumps(profile)}")
            )
        )
    )

async def main():
    await telethon_client.start(phone=PHONE)
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())