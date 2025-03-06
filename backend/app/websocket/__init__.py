from flask_socketio import SocketIO
from .handlers import init_handlers

def register_handlers(socketio: SocketIO):
    """
    웹소켓 이벤트 핸들러 등록
    """
    init_handlers(socketio)