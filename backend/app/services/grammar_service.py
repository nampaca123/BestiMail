from happytransformer import HappyTextToText, TTSettings
import logging
import re

# logger setup
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class GrammarService:
    def __init__(self):
        logger.info("Initializing GrammarService...")
        self.happy_tt = HappyTextToText("T5", "vennify/t5-base-grammar-correction")
        # Increase beam count and minimum length
        self.args = TTSettings(num_beams=10, min_length=1)
        # Edit skip patterns
        self.skip_patterns = re.compile(r'^(Dear|Hello|Hi|Hey|Sincerely|Best|Regards|Thank|Thanks)', re.IGNORECASE)
        logger.info("GrammarService initialized successfully")
    
    def correct_grammar(self, text: str) -> str:
        """Real-time grammar correction"""
        if not text or not isinstance(text, str):
            logger.warning(f"Invalid input: {type(text)}")
            return text
            
        text = text.strip()
        logger.info(f"Starting grammar correction for text: {text}")
        
        # Skip too short sentences
        if len(text) < 3:
            logger.debug("Text too short, skipping correction")
            return text
            
        # Skip greetings/signatures
        if self.skip_patterns.match(text):
            logger.debug("Skipping correction for greeting/signature")
            return text
        
        # Check if the sentence ends with sentence punctuation or newline
        if not any(text.endswith(punct) for punct in ['.', '!', '?', '\n']):
            logger.debug("Text does not end with sentence punctuation or newline, skipping correction")
            return text
            
        # 기존 문장 끝 부호 확인 (로깅용)
        has_newline = text.endswith('\n')
        has_period = text.endswith('.')
        has_exclamation = text.endswith('!')
        has_question = text.endswith('?')
        
        # 교정 수행
        result = self.happy_tt.generate_text("grammar: " + text, args=self.args)
        corrected = result.text.strip()
        
        logger.info(f"Completed grammar correction. Original: '{text}' -> Corrected: '{corrected}'")
        return corrected 