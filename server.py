import asyncio
import sqlite3
from datetime import datetime
from fastapi import FastAPI, HTTPException
import socketio
from fastapi.middleware.cors import CORSMiddleware
from mcstatus import JavaServer
import uvicorn

APP_DB = 'server.db'
SOCKET_NAMESPACE = '/'

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wrap Socket.IO with ASGI
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# --- Database setup ---
conn = sqlite3.connect(APP_DB, check_same_thread=False)
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

# default values
cursor.execute("INSERT OR IGNORE INTO server_info (key, value) VALUES ('name', 'Мой сервер')")
cursor.execute("INSERT OR IGNORE INTO server_info (key, value) VALUES ('ip', 'play.myserver.ru')")
cursor.execute("INSERT OR IGNORE INTO server_info (key, value) VALUES ('version', '1.20.4')")
cursor.execute("INSERT OR IGNORE INTO server_info (key, value) VALUES ('description', 'Добро пожаловать на лучший сервер!')")
cursor.execute("INSERT OR IGNORE INTO rules (id, content) VALUES (1, '1. Будьте вежливы.\n2. Без читов.\n3. Не спамить.')")
conn.commit()

# --- Helper DB functions ---

def get_appeals():
    cursor.execute('SELECT id,title,text,author_id,author_name,status,answer,created_at FROM appeals ORDER BY id DESC')
    rows = cursor.fetchall()
    keys = ["id","title","text","author_id","author_name","status","answer","created_at"]
    return [dict(zip(keys,row)) for row in rows]

async def query_mc_status(host: str, port: int):
    try:
        # mcstatus uses blocking calls; run in thread
        def _sync():
            server = JavaServer(host, port)
            status = server.status()
            return {"online": True, "players": status.players.online}
        result = await asyncio.to_thread(_sync)
        return result
    except Exception:
        return {"online": False, "players": 0}

# --- Socket.IO events ---

@sio.event
async def connect(sid, environ):
    print('Client connected', sid)

@sio.event
async def disconnect(sid):
    print('Client disconnected', sid)

@sio.event
async def get_appeals(sid):
    try:
        items = get_appeals()
        await sio.emit('appeals_list', items, to=sid)
    except Exception as e:
        await sio.emit('error', {'message': str(e)}, to=sid)

@sio.event
async def create_appeal(sid, data):
    try:
        title = data.get('title')
        text = data.get('text')
        author_id = data.get('user_id') or 0
        author_name = data.get('username') or 'anon'
        now = datetime.utcnow().isoformat()
        cursor.execute("INSERT INTO appeals (title, text, author_id, author_name, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                       (title, text, author_id, author_name, 'new', now))
        conn.commit()
        app_item = {
            'id': cursor.lastrowid,
            'title': title,
            'text': text,
            'author_id': author_id,
            'author_name': author_name,
            'status': 'new',
            'created_at': now
        }
        await sio.emit('new_appeal', app_item)
    except Exception as e:
        await sio.emit('error', {'message': str(e)}, to=sid)

@sio.event
async def update_server_info(sid, data):
    try:
        for key in ['name','ip','version','desc']:
            cursor.execute("UPDATE server_info SET value=? WHERE key=?", (data.get(key,''), key))
        conn.commit()
        await sio.emit('server_info_updated', data)
    except Exception as e:
        await sio.emit('error', {'message': str(e)}, to=sid)

@sio.event
async def update_rules(sid, data):
    try:
        rules = data.get('rules','')
        cursor.execute('UPDATE rules SET content=? WHERE id=1', (rules,))
        conn.commit()
        await sio.emit('rules_updated', {'rules': rules})
    except Exception as e:
        await sio.emit('error', {'message': str(e)}, to=sid)

# --- REST endpoints ---

@app.get('/api/status')
async def api_status():
    # read MC host/port from server_info table
    cursor.execute("SELECT value FROM server_info WHERE key='ip'")
    ip = cursor.fetchone()
    host = '31.184.215.105'
    port = 30015
    if ip and ip[0]:
        # if stored like play.example:port
        val = ip[0]
        if ':' in val:
            try:
                host, port = val.split(':')
                port = int(port)
            except Exception:
                host = val
        else:
            host = val
    status = await query_mc_status(host, port)
    return status

@app.get('/api/appeals')
def rest_get_appeals():
    return get_appeals()

# expose socket_app as ASGI

if __name__ == '__main__':
    print('Starting server...')
    uvicorn.run(socket_app, host='0.0.0.0', port=5000)
