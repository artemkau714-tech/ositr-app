import asyncio
import json
import sqlite3
from datetime import datetime
from aiogram import Bot, Dispatcher, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

# === КОНФИГ ===
BOT_TOKEN = "8958654842:AAE2bGWFTOs4xDMgWLDd-Ixl3RUZ86m_szI"
WEBAPP_URL = "https://твой-username.github.io/ositr-app/index.html"  # замени на свою ссылку
# =============

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

# === БАЗА ДАННЫХ ===
conn = sqlite3.connect('server.db')
cursor = conn.cursor()

cursor.execute('''
CREATE TABLE IF NOT EXISTS server_info (
    key TEXT PRIMARY KEY,
    value TEXT
)
''')
cursor.execute('''
CREATE TABLE IF NOT EXISTS rules (id INTEGER PRIMARY KEY, content TEXT)
''')
cursor.execute('''
CREATE TABLE IF NOT EXISTS appeals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT, text TEXT, author_id INTEGER, author_name TEXT,
    status TEXT, answer TEXT, created_at TEXT
)
''')
conn.commit()

# Начальные данные
cursor.execute("INSERT OR IGNORE INTO server_info (key, value) VALUES ('name', 'Мой сервер')")
cursor.execute("INSERT OR IGNORE INTO server_info (key, value) VALUES ('ip', 'play.myserver.ru')")
cursor.execute("INSERT OR IGNORE INTO server_info (key, value) VALUES ('version', '1.20.4')")
cursor.execute("INSERT OR IGNORE INTO server_info (key, value) VALUES ('description', 'Добро пожаловать на лучший сервер!')")
cursor.execute("INSERT OR IGNORE INTO rules (id, content) VALUES (1, '1. Будьте вежливы.\n2. Без читов.\n3. Не спамить.')")
conn.commit()

@dp.message_handler(commands=['start'])
async def start(message: types.Message):
    keyboard = InlineKeyboardMarkup().add(
        InlineKeyboardButton(
            text="🚀 Открыть серверный центр",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    )
    await message.answer(
        "🏠 **Добро пожаловать в серверный центр!**\nНажми на кнопку ниже.",
        reply_markup=keyboard
    )

@dp.message_handler(content_types=['web_app_data'])
async def handle_data(message: types.Message):
    data = json.loads(message.web_app_data.data)
    action = data.get('action')

    if action == 'save_server_info':
        for key in ['name', 'ip', 'version', 'desc']:
            cursor.execute("UPDATE server_info SET value=? WHERE key=?", (data[key], key))
        conn.commit()
        await message.answer("✅ Информация сервера обновлена!")

    elif action == 'save_rules':
        cursor.execute("UPDATE rules SET content=?", (data['rules'],))
        conn.commit()
        await message.answer("✅ Правила обновлены!")

    elif action == 'new_appeal':
        cursor.execute(
            "INSERT INTO appeals (title, text, author_id, author_name, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (data['title'], data['text'], data['user_id'], data['username'], 'new', datetime.now().isoformat())
        )
        conn.commit()
        await message.answer("✅ Обращение принято!")

    elif action == 'answer_appeal':
        cursor.execute(
            "UPDATE appeals SET status='answered', answer=? WHERE id=?",
            (data['answer'], data['appeal_id'])
        )
        conn.commit()
        await message.answer(f"✅ Ответ на обращение #{data['appeal_id']} отправлен!")

    elif action == 'archive_appeal':
        cursor.execute("UPDATE appeals SET status='archived' WHERE id=?", (data['appeal_id'],))
        conn.commit()
        await message.answer(f"✅ Обращение #{data['appeal_id']} отправлено в архив")

async def main():
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())