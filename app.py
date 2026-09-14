# -*- coding: utf-8 -*-
"""
Конверсионный сайт «Битрикс24: гид по автоматизации» на Flask.

Запуск в режиме разработки:
    python app.py

Запуск локально, порт 5000:  http://127.0.0.1:5000
(доступен и другим устройствам в локальной сети по IP компьютера)

Контент карточек лежит в файле content.json — правите его и просто
обновляете страницу, сервер перезагружать не нужно.
"""
import json
import os
from pathlib import Path

from flask import Flask, render_template

# Пути к файлам проекта (работают из любой папки запуска)
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "content.json"

# Тег, который выделяется на сайте: выводится бейджем, первым в фильтрах
# и карточки с ним поднимаются в начало сетки.
FEATURED_TAG = "наши внедрения"


def load_content():
    """Читаем контент из content.json и возвращаем (данные сайта, карточки)."""
    with DATA_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)
    return data["site"], data["cards"]


def has_featured_tag(card):
    """Есть ли у карточки выделенный тег? Регистр не важен."""
    return any(tag.lower() == FEATURED_TAG for tag in card.get("tags", []))


def sort_cards(cards):
    """Карточки с выделенным тегом — первыми, остальные после них."""
    return sorted(cards, key=has_featured_tag, reverse=True)


app = Flask(__name__)

# Секретный ключ нужен Flask для подписи cookie.
# Никогда не храните настоящий ключ в коде — задавайте через переменную
# окружения SECRET_KEY при публикации в интернет.
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-only-key-change-me")


@app.after_request
def add_security_headers(response):
    """Защитные HTTP-заголовки, важные при публикации в интернет."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers[
        "Content-Security-Policy"
    ] = "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
    return response


@app.route("/")
def index():
    """Главная страница: отдаём site-данные и карточки в шаблон."""
    site, cards = load_content()
    return render_template("index.html", site=site, cards=sort_cards(cards))


if __name__ == "__main__":
    # FLASK_DEBUG=1 включает автоперезагрузку и отладочные панели.
    # В Интернете режим отладки включать НЕЛЬЗЯ.
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)