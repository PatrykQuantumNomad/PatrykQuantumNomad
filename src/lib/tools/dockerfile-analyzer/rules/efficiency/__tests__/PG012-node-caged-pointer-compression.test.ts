import { describe, it, expect } from 'vitest';
import { DockerfileParser } from 'dockerfile-ast';
import { PG012 } from '../PG012-node-caged-pointer-compression';

describe('PG012 - consider pointer compression for Node.js images', () => {
  it('flags official node image in final stage', () => {
    const content = [
      'FROM node:22-bookworm-slim',
      'WORKDIR /app',
      'COPY . .',
      'CMD ["node", "server.js"]',
    ].join('\n');

    const dockerfile = DockerfileParser.parse(content);
    const violations = PG012.check(dockerfile, content);

    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('PG012');
    expect(violations[0].line).toBe(1);
  });

  it('stays silent for python image', () => {
    const content = [
      'FROM python:3.12-slim',
      'WORKDIR /app',
      'COPY . .',
      'CMD ["python", "app.py"]',
    ].join('\n');

    const dockerfile = DockerfileParser.parse(content);
    const violations = PG012.check(dockerfile, content);

    expect(violations).toHaveLength(0);
  });

  it('stays silent for custom registry node image', () => {
    const content = [
      'FROM myregistry.io/node:22',
      'WORKDIR /app',
      'COPY . .',
      'CMD ["node", "server.js"]',
    ].join('\n');

    const dockerfile = DockerfileParser.parse(content);
    const violations = PG012.check(dockerfile, content);

    expect(violations).toHaveLength(0);
  });

  it('stays silent when node is only in builder stage and final is python', () => {
    const content = [
      'FROM node:22 AS builder',
      'RUN npm ci',
      'FROM python:3.12',
      'COPY --from=builder /app .',
      'CMD ["python", "app.py"]',
    ].join('\n');

    const dockerfile = DockerfileParser.parse(content);
    const violations = PG012.check(dockerfile, content);

    expect(violations).toHaveLength(0);
  });

  it('flags node in final stage of multi-stage build', () => {
    const content = [
      'FROM node:22 AS builder',
      'RUN npm ci',
      'FROM node:22-slim',
      'COPY --from=builder /app .',
      'CMD ["node", "server.js"]',
    ].join('\n');

    const dockerfile = DockerfileParser.parse(content);
    const violations = PG012.check(dockerfile, content);

    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('PG012');
    expect(violations[0].line).toBe(3);
  });

  it('stays silent for FROM scratch', () => {
    const content = [
      'FROM node:22 AS builder',
      'RUN npm ci',
      'FROM scratch',
      'COPY --from=builder /app /app',
      'ENTRYPOINT ["/app"]',
    ].join('\n');

    const dockerfile = DockerfileParser.parse(content);
    const violations = PG012.check(dockerfile, content);

    expect(violations).toHaveLength(0);
  });

  it('stays silent when final FROM references a build stage alias named "node"', () => {
    const content = [
      'FROM node:22 AS node',
      'RUN npm ci',
      'FROM node',
      'COPY --from=node /app .',
      'CMD ["node", "server.js"]',
    ].join('\n');

    const dockerfile = DockerfileParser.parse(content);
    const violations = PG012.check(dockerfile, content);

    expect(violations).toHaveLength(0);
  });
});
