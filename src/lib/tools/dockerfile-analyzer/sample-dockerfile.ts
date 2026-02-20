export const SAMPLE_DOCKERFILE = `# Dockerfile with common issues — paste yours to analyze!

FROM ubuntu:latest

MAINTAINER john@example.com

RUN apt-get update
RUN apt-get install -y curl wget git python3 nodejs

ADD https://example.com/app.tar.gz /app/
COPY . /app

WORKDIR app
RUN cd /tmp && do-something

ENV API_KEY=sk-1234567890abcdef
ENV DATABASE_URL=postgres://admin:password@db:5432/myapp

RUN pip install flask requests numpy
RUN npm install

EXPOSE 80
EXPOSE 8080
EXPOSE 99999

RUN chmod 777 /app

USER root

CMD node server.js
`;
