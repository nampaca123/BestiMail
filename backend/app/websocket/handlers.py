from flask_socketio import emit
from app.services.grammar_service import GrammarService
from app.services.openai_service import OpenAIService

grammar_service = GrammarService()
openai_service = OpenAIService()

def init_handlers(socketio):
    @socketio.on('connect')
    def handle_connect():
        print('Client connected')

    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected')

    @socketio.on('check_grammar')
    def handle_grammar_check(data):
        """
        실시간 문법 교정을 처리하는 핸들러
        """
        from flask import current_app
        
        current_app.logger.info("=== Grammar check request received ===")
        text = data.get('text', '')
        current_app.logger.info(f"[Handler] Processing text: '{text}'")
        
        if not text.strip():
            current_app.logger.warning("[Handler] Empty text received")
            emit('grammar_result', {'corrected_text': text})
            return
        
        try:
            # 문법 교정 서비스 호출
            corrected_text = grammar_service.correct_grammar(text)
            current_app.logger.info(f"[Handler] Sending correction: '{corrected_text}'")
            
            # 교정 전후 단어 비교 로그 추가
            original_words = text.split()
            corrected_words = corrected_text.split()
            
            for i, (orig, corr) in enumerate(zip(original_words, corrected_words)):
                if orig != corr:
                    current_app.logger.info(f"[Handler] Word correction: '{orig}' -> '{corr}'")
            
            emit('grammar_result', {'corrected_text': corrected_text})
        except Exception as e:
            current_app.logger.error(f"[Handler] Error during grammar correction: {str(e)}")
            emit('error', {'message': str(e)})

    @socketio.on('formalize')
    def handle_formalize(data):
        """
        OpenAI를 사용해 이메일을 공식적인 톤으로 변환
        """
        text = data.get('text', '')
        formalized = openai_service.formalize_text(text)
        emit('formalize_result', {'formalized_text': formalized}) 