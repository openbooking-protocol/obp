#!/usr/bin/env node
/**
 * create-obp-server — scaffold a new OBP-compatible server
 * Usage: npx create-obp-server [project-name] [--template minimal|full]
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function parseArgs(argv: string[]): { name: string; template: string } {
  const args = argv.slice(2);
  let name = args[0] && !args[0].startsWith("-") ? args[0] : "my-obp-server";
  let template = "minimal";
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--template" || args[i] === "-t") && args[i + 1]) {
      template = args[++i]!;
    }
  }
  return { name, template };
}

const PACKAGE_JSON = (name: string) => JSON.stringify({
  name,
  version: "0.1.0",
  description: "OBP-compatible booking server",
  type: "module",
  scripts: {
    dev: "tsx watch src/index.ts",
    build: "tsc",
    start: "node dist/index.js",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx src/db/seed.ts",
  },
  dependencies: {
    fastify: "^4.28.1",
    "@fastify/cors": "^9.0.1",
    "@fastify/rate-limit": "^9.1.0",
    "drizzle-orm": "^0.31.4",
    postgres: "^3.4.4",
    ioredis: "^5.4.1",
    zod: "^3.23.8",
    pino: "^9.3.2",
    dotenv: "^16.4.5",
  },
  devDependencies: {
    typescript: "^5.5.4",
    tsx: "^4.16.2",
    "drizzle-kit": "^0.22.8",
    "@types/node": "^20.14.12",
    vitest: "^2.0.5",
  },
}, null, 2);

const TSCONFIG = JSON.stringify({
  compilerOptions: {
    target: "ES2022",
    module: "NodeNext",
    moduleResolution: "NodeNext",
    strict: true,
    noUncheckedIndexedAccess: true,
    outDir: "dist",
    skipLibCheck: true,
  },
  include: ["src/**/*.ts"],
  exclude: ["node_modules", "dist"],
}, null, 2);

const ENV_EXAMPLE = `# OBP Server Configuration
NODE_ENV=development
PORT=3000

# PostgreSQL
DATABASE_URL=postgresql://obp:obp@localhost:5432/obp

# Redis
REDIS_URL=redis://localhost:6379

# Security
API_KEY_SECRET=change-me-in-production-min-32-chars
JWT_SECRET=change-me-in-production-min-32-chars

# Server identity
OBP_SERVER_NAME=My OBP Server
OBP_SERVER_URL=http://localhost:3000

# Federation (optional)
FEDERATION_ENABLED=true
`;

const DOCKER_COMPOSE = `version: '3.9'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: obp
      POSTGRES_PASSWORD: obp
      POSTGRES_DB: obp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
`;

const INDEX_TS = `import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import 'dotenv/config';

const app = Fastify({
  logger: true,
  genReqId: () => crypto.randomUUID(),
});

await app.register(cors);
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Well-known discovery
app.get('/.well-known/obp', async () => ({
  obp_version: '1.0.0',
  server_url: process.env.OBP_SERVER_URL ?? 'http://localhost:3000',
  server_name: process.env.OBP_SERVER_NAME ?? 'My OBP Server',
  federation_enabled: process.env.FEDERATION_ENABLED === 'true',
  features: ['bookings', 'webhooks', 'ical'],
}));

// TODO: Add your routes here
// app.register(import('./routes/providers.js'), { prefix: '/obp/v1' });
// app.register(import('./routes/services.js'), { prefix: '/obp/v1' });
// app.register(import('./routes/slots.js'), { prefix: '/obp/v1' });
// app.register(import('./routes/bookings.js'), { prefix: '/obp/v1' });

const port = parseInt(process.env.PORT ?? '3000', 10);
await app.listen({ port, host: '0.0.0.0' });
console.log(\`OBP server running on http://localhost:\${port}\`);
`;

const GITIGNORE = `node_modules/
dist/
.env
*.local
coverage/
`;

const README = (name: string) => `# ${name}

An OBP-compatible booking server.

## Quick start

\`\`\`bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start PostgreSQL and Redis
docker-compose up -d

# Run database migrations
npm run db:migrate

# Seed with test data
npm run db:seed

# Start development server
npm run dev
\`\`\`

Server runs at http://localhost:3000.

Verify with the OBP validator:
\`\`\`bash
npx @obp/validator http://localhost:3000
\`\`\`

## Project structure

\`\`\`
src/
├── index.ts          # Application entry point
├── db/               # Database schema + migrations
├── routes/           # HTTP route handlers
├── modules/          # Business logic
└── middleware/       # Auth, validation, etc.
\`\`\`

## Implementing OBP endpoints

See the [OBP documentation](https://github.com/openbooking-protocol/obp) for the full specification.

Required endpoints:
- \`GET /.well-known/obp\` — server discovery
- \`GET /obp/v1/providers\` — list providers
- \`GET /obp/v1/services\` — list services
- \`GET /obp/v1/slots\` — list available slots
- \`POST /obp/v1/slots/:id/hold\` — hold a slot
- \`POST /obp/v1/bookings\` — create booking
- \`GET /obp/v1/bookings/:id\` — get booking status
- \`POST /obp/v1/bookings/:id/cancel\` — cancel booking
`;

async function scaffold(name: string, _template: string): Promise<void> {
  const dir = resolve(process.cwd(), name);

  if (existsSync(dir)) {
    console.error(`Error: Directory "${name}" already exists.`);
    process.exit(1);
  }

  console.log(`\n${BOLD}Creating OBP server: ${name}${RESET}\n`);

  const files: Array<[string, string]> = [
    ["package.json", PACKAGE_JSON(name)],
    ["tsconfig.json", TSCONFIG],
    [".env.example", ENV_EXAMPLE],
    ["docker-compose.yml", DOCKER_COMPOSE],
    ["src/index.ts", INDEX_TS],
    [".gitignore", GITIGNORE],
    ["README.md", README(name)],
  ];

  for (const [filePath, content] of files) {
    const full = join(dir, filePath);
    await mkdir(join(full, ".."), { recursive: true });
    await writeFile(full, content, "utf-8");
    console.log(`  ${GREEN}create${RESET}  ${filePath}`);
  }

  console.log(`\n${GREEN}${BOLD}✓ Project created successfully!${RESET}`);
  console.log(`\n${BLUE}Next steps:${RESET}`);
  console.log(`  ${DIM}cd${RESET} ${name}`);
  console.log(`  ${DIM}npm install${RESET}`);
  console.log(`  ${DIM}cp .env.example .env${RESET}`);
  console.log(`  ${DIM}docker-compose up -d${RESET}`);
  console.log(`  ${DIM}npm run dev${RESET}`);
  console.log(`\n  Then validate: ${DIM}npx @obp/validator http://localhost:3000${RESET}\n`);
}

const { name, template } = parseArgs(process.argv);
await scaffold(name, template);
