from flask_socketio import emit
from app.services.grammar_service import GrammarService
from app.services.openai_service import OpenAIService
from app.services.email_service import EmailService

grammar_service = GrammarService()
openai_service = OpenAIService()
email_service = EmailService()

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
        Handle real-time grammar correction
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
            # Call grammar correction service
            corrected_text = grammar_service.correct_grammar(text)
            current_app.logger.info(f"[Handler] Sending correction: '{corrected_text}'")
            
            # Add word comparison log for before and after correction
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
        Convert email to formal tone using OpenAI
        """
        text = data.get('text', '')
        formalized = openai_service.formalize_text(text)
        emit('formalize_result', {'formalized_text': formalized})

    @socketio.on('send_email')
    def handle_send_email(data):
        """
        Send email using SendGrid
        """
        to_email = data.get('to')
        cc_email = data.get('cc')
        subject = data.get('subject')
        content = data.get('content')
        
        success = email_service.send_email(to_email, cc_email, subject, content)
        emit('email_result', {'success': success}) 