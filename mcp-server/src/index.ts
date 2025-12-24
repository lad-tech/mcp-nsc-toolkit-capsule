import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import * as z from 'zod/v4';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Чтение документации из файлов
const frameworkDocumentation = readFileSync(join(__dirname, '..', '..', 'docs', 'nsc-tookit.md'), 'utf-8');
const archlandDocumentation = readFileSync(join(__dirname, '..', '..', 'docs', 'nsc-toolkit-archland.md'), 'utf-8');

const responseDoc = (result: string) => {
  return {
    content: [{ type: 'text' as const, text: result }],
    structuredContent: { result },
  };
};

// Создание MCP сервера с использованием SDK
const server = new McpServer({
  name: 'mcp-nsc-toolkit-capsule',
  version: '1.0.0',
});

server.registerTool(
  'get-framework-documentation',
  {
    title: 'Документация по использованию фреймворка nsc-tookit',
    description: 'Получить документацию по фреймворку nsc-toolkit',
    outputSchema: { result: z.string() },
  },
  async () => {
    return responseDoc(frameworkDocumentation);
  }
);

server.registerTool(
  'get-archland-documentation',
  {
    title: 'Документация по артефакту archland его назначению и использованию',
    description: 'Получить документацию по созданию артефакта archland',
    outputSchema: { result: z.string() },
  },
  async () => {
    return responseDoc(archlandDocumentation);
  }
);

const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  console.log('Incoming: ', req.body);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on('close', () => {
    transport.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get('/mcp', async (req, res) => {
  console.log('Incoming GET: ', req.headers);

  if (req.headers.accept === 'text/event-stream') {
    res.writeHead(405).end();
  } else {
    res.writeHead(404).end();
  }
});

const port = parseInt(process.env.PORT || '3000');
app
  .listen(port, () => {
    console.log(`nsc-toolkit MCP Server running on http://localhost:${port}/mcp`);
  })
  .on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
