import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export interface ProviderConfig {
  id: string;
  displayName: string;
  defaultTone: string;
  constraints: string[];
  successCriteria: string[];
}

export function loadProviderConfig(providerId: string): ProviderConfig {
  const filePath = path.resolve(process.cwd(), 'providers', `${providerId}.yml`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = yaml.load(raw) as ProviderConfig;

  if (!parsed?.id || !parsed?.displayName) {
    throw new Error(`Invalid provider config: ${providerId}`);
  }

  return parsed;
}
