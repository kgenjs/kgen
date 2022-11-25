#!/usr/bin/env node
import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { loadJSONConfig } from '@kgen/core';
import { downloadTemplate } from './download.js';
import { configFilePath } from './config.js';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __filename = url.fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(__filename);

program.name('kgen');

program
  .argument('<template>')
  .description('Generate a Node.js project from template.')
  .option('-f, --fresh', 'download a fresh copy of template even if it exists')
  .action(async (template: string) => {
    const templateName = `${template.split('/')[0]}-${template.split('/')[1]}`;
    const templatePath = path.join(__dirname, '../templates', templateName);
    const options = program.opts();
    console.log(options);
    if (!fs.existsSync(templatePath) || options.fresh) {
      await downloadTemplate(template);
    }
    const templateConfig = loadJSONConfig(path.join(templatePath, 'kgenconfig.json'));
    const pkg = await import(path.join(templatePath, templateConfig.main));
    await pkg.default();
  });

program
  .command('config')
  .description('Show confguration file path.')
  .action(() => {
    console.log(`Config file is located at ${configFilePath}`);
  });

program.parse();
