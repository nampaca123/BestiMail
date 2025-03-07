from flask_socketio import SocketIO
from .handlers import init_handlers

def register_handlers(socketio: SocketIO):
    """
    Register WebSocket event handlers
    """
    init_handlers(socketio)