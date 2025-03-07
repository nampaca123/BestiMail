from openai import OpenAI
from config import Config
import logging

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=Config.OPENAI_API_KEY)
    
    def formalize_text(self, text: str) -> str:
        """Formalizes and corrects the grammar of the input text using GPT-4.
        
        Args:
            text (str): The input text to be formalized
            
        Returns:
            str: The formalized and corrected text
            
        Raises:
            Exception: If the API call fails
        """
        try:
            logger.info(f"Received text for formalization:\n{text}")
            
            system_prompt = """You are a professional email editor for a real estate investment firm. Your task is to:
1. Fix any grammar or spelling mistakes
2. Make the tone formal and professional for real estate investment communications
3. Improve clarity, conciseness, and readability while maintaining paragraph structure
4. Preserve all business-critical information and maintain the original intent

Respond ONLY with the corrected text, without any explanations or additional comments.
The text should maintain proper line breaks and formatting."""

            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            corrected_text = response.choices[0].message.content.strip()
            logger.info(f"Formalized text result:\n{corrected_text}")
            return corrected_text
            
        except Exception as e:
            logger.error(f"Error in text formalization: {str(e)}")
            raise