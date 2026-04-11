FROM unclecode/crawl4ai:latest

WORKDIR /app
COPY ./scripts /app

COPY requirements.txt .
RUN pip install -r requirements.txt

CMD ["tail", "-f", "/dev/null"]
