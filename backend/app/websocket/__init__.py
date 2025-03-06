from flask_socketio import SocketIO
from .handlers import handle_grammar_check, handle_connect, handle_formalize

def register_handlers(socketio: SocketIO):
    """
    웹소켓 이벤트 핸들러 등록
    """
    socketio.on_event('check_grammar', handle_grammar_check)
    socketio.on_event('connect', handle_connect)
    socketio.on_event('formalize', handle_formalize)