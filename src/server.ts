import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { createApiRouter } from './routes/api.js';
import { RealtimeBridge } from './integrations/realtimeBridge.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = createServer(app);
const bridge = new RealtimeBridge(server);

app.use('/api', createApiRouter(bridge));
app.use(express.static(path.resolve(__dirname, '../public')));

app.get('{*path}', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

server.listen(env.PORT, () => {
  console.log(`Mission Control running on http://localhost:${env.PORT}`);
});
