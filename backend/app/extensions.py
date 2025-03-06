from flask_socketio import SocketIO
from redis import Redis
from config import Config

socketio = SocketIO()
redis_client = Redis.from_url(Config.REDIS_URL) 