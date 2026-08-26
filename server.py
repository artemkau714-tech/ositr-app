from flask import Flask, request, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)  # Разрешаем запросы с фронтенда

# Хранилище (в реальном проекте используйте БД)
admins = [
    {"id": 1, "name": "Alex", "role": "Главный админ"},
    {"id": 2, "name": "Bob", "role": "Модератор"},
]
ratings = []

@app.route('/api/admins', methods=['POST'])
def get_admins():
    return jsonify({"admins": admins})

@app.route('/api/rating', methods=['POST'])
def submit_rating():
    data = request.json
    admin_id = data.get('admin_id')
    rating = data.get('rating')
    comment = data.get('comment', '')
    user_id = data.get('tg_user_id')
    
    # Проверяем, существует ли админ
    admin = next((a for a in admins if str(a['id']) == str(admin_id)), None)
    if not admin:
        return jsonify({"success": False, "error": "Админ не найден"}), 404
    
    # Сохраняем оценку
    ratings.append({
        "admin_id": admin_id,
        "user_id": user_id,
        "rating": rating,
        "comment": comment,
        "timestamp": __import__('time').time()
    })
    
    return jsonify({"success": True, "message": "Оценка сохранена"})

@app.route('/api/accept_rules', methods=['POST'])
def accept_rules():
    data = request.json
    print(f"Пользователь {data.get('tg_user_id')} принял правила")
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
  @app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)