from happytransformer import HappyTextToText, TTSettings
import logging

# logger setup
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class GrammarService:
    def __init__(self):
        logger.info("Initializing GrammarService...")
        self.happy_tt = HappyTextToText("T5", "vennify/t5-base-grammar-correction")
        self.args = TTSettings(num_beams=5, min_length=1)
        logger.info("GrammarService initialized successfully")
    
    def correct_grammar(self, text: str) -> str:
        """Real-time grammar correction"""
        if not text or not isinstance(text, str):
            logger.warning(f"Invalid input: {type(text)}")
            return text
            
        logger.info(f"Starting grammar correction for text: {text}")
        
        # Check if the sentence ends with sentence punctuation
        if not any(text.strip().endswith(punct) for punct in ['.', '!', '?']):
            logger.debug("Text does not end with sentence punctuation, skipping correction")
            return text
            
        result = self.happy_tt.generate_text("grammar: " + text, args=self.args)
        corrected = result.text.strip()
        
        logger.info(f"Completed grammar correction. Original: '{text}' -> Corrected: '{corrected}'")
        return corrected 