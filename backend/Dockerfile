FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5001

ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV FLASK_DEBUG=0

# Gunicorn으로 실행 (run:app으로 변경)
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--worker-class", "eventlet", "run:app"] 