from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
import logging

# 로거 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask-SocketIO 인스턴스 생성
socketio = SocketIO(cors_allowed_origins="*")

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # 설정 로드
    app.config.from_object('config.Config')
    
    # SocketIO 초기화
    socketio.init_app(app)
    
    # 웹소켓 핸들러 등록
    from .websocket import register_handlers
    register_handlers(socketio)
    
    logger.info("BestiMail startup")
    return app