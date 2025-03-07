from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
import logging

# logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask-SocketIO instance
socketio = SocketIO(cors_allowed_origins="*")

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Load configuration
    app.config.from_object('config.Config')
    
    # Initialize SocketIO
    socketio.init_app(app)
    
    # Register WebSocket handlers
    from .websocket import register_handlers
    register_handlers(socketio)
    
    logger.info("BestiMail startup")
    return app