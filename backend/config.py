import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev_key')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')