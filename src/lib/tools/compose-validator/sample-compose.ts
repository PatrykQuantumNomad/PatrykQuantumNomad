export const SAMPLE_COMPOSE = `# Docker Compose with common issues — paste yours to validate!

version: "3.8" # CV-B006: deprecated version field

servces: # CV-S002: typo — unknown top-level property (should be "services")
  db:
    image: postgres

services:
  # CV-F001: services not alphabetical (worker before web)
  worker:
    image: redis:latest # CV-C014: using :latest tag; CV-B004: tag not pinned
    depends_on:
      - api # CV-M002: circular dependency (api -> worker -> api)
    networks:
      - nonexistent # CV-M003: undefined network
    ports:
      - 8080:6379 # CV-F002: unquoted port; CV-M001: duplicate host port 8080

  api:
    image: node:20-slim
    privileged: true # CV-C001: privileged mode enabled
    network_mode: host # CV-C003: host network mode
    depends_on:
      - worker
    environment:
      NODE_ENV: production
      DB_PASSWORD: supersecret123 # CV-C008: hardcoded secret in environment
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock # CV-C002: Docker socket mount
      - data:/app/data # CV-M004: undefined volume (data not declared)
    ports:
      - 8080:3000 # CV-M001: duplicate host port 8080 (conflicts with worker)

  web:
    image: nginx:latest # CV-C014: using :latest tag; CV-B004: tag not pinned
    ports:
      - "80:80"
    # CV-B001: no healthcheck defined
    # CV-B002: no restart policy
    # CV-B003: no resource limits
    # CV-B005: no logging config

networks:
  frontend:
    driver: bridge
  backend: {} # CV-M007: orphan network — not used by any service

volumes:
  logs: {} # CV-M008: orphan volume — not used by any service
`;
