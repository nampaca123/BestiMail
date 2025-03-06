from flask import Flask
from app.extensions import socketio, redis_client
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    socketio.init_app(app)
    
    from app.websocket import register_handlers
    register_handlers(socketio)
    
    return app