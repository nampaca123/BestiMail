from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from config import Config
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.sg = SendGridAPIClient(Config.SENDGRID_API_KEY)
    
    def send_email(self, from_email: str, to_email: str, subject: str, content: str) -> bool:
        """Send email using SendGrid API"""
        logger.info(f"Sending email from {from_email} to {to_email}")
        logger.info(f"Subject: {subject}")
        
        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject=subject,
            html_content=content
        )
        
        try:
            response = self.sg.send(message)
            success = response.status_code == 202
            logger.info(f"Email sent successfully: {success}")
            return success
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False 