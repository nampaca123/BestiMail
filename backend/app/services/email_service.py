from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from config import Config

class EmailService:
    def __init__(self):
        self.sg = SendGridAPIClient(Config.SENDGRID_API_KEY)
    
    def send_email(self, from_email: str, to_email: str, subject: str, content: str) -> bool:
        """
        SendGrid를 사용하여 이메일 전송
        """
        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject=subject,
            html_content=content
        )
        
        try:
            response = self.sg.send(message)
            return response.status_code == 202
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            return False 