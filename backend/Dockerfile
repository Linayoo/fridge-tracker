FROM python:3.11-slim

WORKDIR /app

# requirements.txt is a build artifact generated from poetry.lock.
# Regenerate it after any dependency change: see backend/README (or run
# `python3 scripts/export_requirements.py` once that script is added).
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
