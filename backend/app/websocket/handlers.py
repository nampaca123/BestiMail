from flask_socketio import emit
from app import redis_client
from app.services.grammar_service import GrammarService
from app.services.openai_service import OpenAIService

grammar_service = GrammarService(redis_client)
openai_service = OpenAIService()

def handle_grammar_check(data):
    """
    실시간 문법 교정을 처리하는 핸들러
    """
    text = data.get('text', '')
    corrected_text = grammar_service.correct_grammar(text)
    emit('grammar_result', {'corrected_text': corrected_text})

def handle_connect():
    """
    웹소켓 연결 시 처리하는 핸들러
    """
    emit('connected', {'data': 'Connected to grammar service'})

def handle_formalize(data):
    """
    OpenAI를 사용해 이메일을 공식적인 톤으로 변환
    """
    text = data.get('text', '')
    formalized_text = openai_service.formalize_text(text)  # OpenAI 서비스 필요
    emit('formalize_result', {'formalized_text': formalized_text}) 