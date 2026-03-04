FROM ubuntu
RUN apt-get update
RUN apt-get install -y curl wget netcat
RUN curl -sSL https://example.com/install.sh | bash
ENV API_KEY=sk-1234567890abcdef
ENV DB_PASSWORD=mysecretpassword
ADD ./config /app/config
COPY .env /app/.env
RUN sudo chmod 777 /app
EXPOSE 8080
CMD node server.js
