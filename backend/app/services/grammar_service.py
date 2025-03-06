from happytransformer import HappyTextToText, TTSettings
from redis import Redis
import re
import json

class GrammarService:
    def __init__(self, redis_client: Redis):
        self.happy_tt = HappyTextToText("T5", "vennify/t5-base-grammar-correction")
        self.args = TTSettings(num_beams=5, min_length=1)
        self.redis_client = redis_client
    
    def _tokenize(self, text: str) -> list:
        """텍스트를 단어/문장 단위로 분리"""
        return re.findall(r'\b[\w\']+\b|[.,!?;]', text)
    
    def _check_cache(self, word: str) -> str | None:
        """Redis에서 단어 검색 (오타:교정 쌍으로 저장)"""
        cache_key = f"corrections:{word.lower()}"
        cached = self.redis_client.get(cache_key)
        if cached:
            corrections = json.loads(cached)
            return corrections.get('corrected')
        return None
    
    def _cache_correction(self, original: str, corrected: str):
        """교정 결과를 오타:교정 쌍으로 저장"""
        if original.lower() != corrected.lower():
            cache_key = f"corrections:{original.lower()}"
            correction_data = {
                'original': original,
                'corrected': corrected
            }
            self.redis_client.setex(
                cache_key, 
                3600*24,  # 24시간 캐시
                json.dumps(correction_data)
            )
    
    def correct_grammar(self, text: str) -> str:
        """실시간 문법 교정"""
        tokens = self._tokenize(text)
        corrections = []
        
        for token in tokens:
            # 캐시된 교정 확인
            cached = self._check_cache(token)
            if cached:
                corrections.append(cached)
                continue
            
            # 새로운 교정 수행
            result = self.happy_tt.generate_text("grammar: " + token, args=self.args)
            corrected = result.text.strip()
            
            # 교정 결과 캐싱
            self._cache_correction(token, corrected)
            corrections.append(corrected)
        
        return ' '.join(corrections) 