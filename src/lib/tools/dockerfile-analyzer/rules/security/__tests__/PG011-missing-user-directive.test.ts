import { describe, it, expect } from 'vitest';
import { DockerfileParser } from 'dockerfile-ast';
import { PG011 } from '../PG011-missing-user-directive';

describe('PG011 - missing USER directive', () => {
  it('flags Dockerfile with no USER instruction', () => {
    const content = [
      'FROM node:22-bookworm-slim',
      'WORKDIR /app',
      'COPY . .',
      'CMD ["node", "server.js"]',
    ].join('\n');

    const dockerfile = DockerfileParser.parse(content);
    const violations = PG011.check(dockerfile, content);

    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('PG011');
    expect(violations[0].line).toBe(1);
  });

  it('stays silent when USER root is present (defers to DL3002)', () => {
    const content = [
      'FROM node:22-bookworm-slim',
      'WORKDIR /app',
      'USER root',
      'CMD ["node", "server.js"]',
    ].join('\n');

    const dockerfile = DockerfileParser.parse(content);
    const violations = PG011.check(dockerfile, content);

    expect(violations).toHaveLength(0);
  });

  it('flags multi-stage Dockerfile when USER exists only in builder stage', () => {
    const content = [
      'FROM node:22 AS builder',
      'USER node',
      'RUN npm ci',
      'FROM node:22-bookworm-slim',
      'WORKDIR /app',
      'COPY --from=builder /app .',
      'CMD ["node", "server.js"]',
    ].join('\n');

    const dockerfile = DockerfileParser.parse(content);
    const violations = PG011.check(dockerfile, content);

    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('PG011');
    // Violation should point to the second FROM line (line 4, 1-based)
    expect(violations[0].line).toBe(4);
  });

  it('stays silent for FROM scratch (no user system)', () => {
    const content = [
      'FROM golang:1.22 AS builder',
      'RUN go build -o /app',
      'FROM scratch',
      'COPY --from=builder /app /app',
      'ENTRYPOINT ["/app"]',
    ].join('\n');

    const dockerfile = DockerfileParser.parse(content);
    const violations = PG011.check(dockerfile, content);

    expect(violations).toHaveLength(0);
  });

  it('stays silent when non-root USER is present in final stage', () => {
    const content = [
      'FROM node:22-bookworm-slim',
      'RUN groupadd -g 10001 app && useradd -u 10001 -g app appuser',
      'WORKDIR /app',
      'COPY . .',
      'USER appuser',
      'CMD ["node", "server.js"]',
    ].join('\n');

    const dockerfile = DockerfileParser.parse(content);
    const violations = PG011.check(dockerfile, content);

    expect(violations).toHaveLength(0);
  });
});
