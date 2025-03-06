from openai import OpenAI
from config import Config

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=Config.OPENAI_API_KEY)
    
    def formalize_text(self, text: str) -> str:
        """이메일을 공식적인 톤으로 변환"""
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Convert the following email to a formal business tone."},
                {"role": "user", "content": text}
            ]
        )
        return response.choices[0].message.content 