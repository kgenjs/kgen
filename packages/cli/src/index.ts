#!/usr/bin/env node
import { loadJSONConfig, log } from '@kgen/core';
import chalk from 'chalk';
import { program } from 'commander';
import * as fs from 'fs';
import { createRequire } from 'module';
import * as path from 'path';
import * as url from 'url';
import { configFilePath } from './config.js';
import { downloadTemplate } from './download.js';
import actionRunner from './utils.js';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __filename = url.fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(__filename);

const downloadTemplateCLI = async (template: string) => {
  log(`Downloading ${template} from remote...`);
  const res = await downloadTemplate(template);
  if (res.status !== 'success') {
    log(res.msg, {
      level: 'error',
    });
    process.exit(1);
  }
  log(`Template ${template} downloaded successfully.`);
};

program.name('kgen');

program
  .command('download')
  .argument('<template>', 'Template to download.')
  .description('Download template to local machine.')
  .action(actionRunner(downloadTemplateCLI));

program
  .command('gen')
  .argument('<template>', 'Template to generate from.')
  .argument('[dest]', 'Path to generate content to.')
  .description('Generate a Node.js project from template.')
  .option('-f, --fresh', 'download a fresh copy of template even if it exists')
  .action(
    actionRunner(async (template: string, userDest: string | undefined, options) => {
      const [owner, repo] = template.includes('/') ? template.split('/') : ['kgenjs', template];
      const templateName = `${owner}-${repo}`;
      const templatePath = path.join(__dirname, '../templates', templateName);
      const dest = userDest ?? './';

      if (!fs.existsSync(templatePath) || options.fresh) {
        await downloadTemplateCLI(template);
      }

      const templateConfig = loadJSONConfig(path.join(templatePath, 'kgenconfig.json'));
      const pkg = await import(path.join(templatePath, templateConfig.main));
      try {
        await pkg.default(dest);
      } catch (err) {
        console.log();
        log(`Failed to generate from template ${template}.`, {
          level: 'error',
        });
        console.log(
          chalk.red(
            'This is most likely due to an inner failure of target template generator, please',
            `contact the template author to fix this issue. Template repository: https://github.com/${owner}/kgen-template-${repo}.`,
          ),
        );
        console.log(chalk.gray(typeof err === 'string' ? err : err.stack));
      }
    }),
  );

program
  .command('config')
  .description('Show confguration file path.')
  .action(
    actionRunner(() => {
      console.log(`Config file is located at ${configFilePath}`);
    }),
  );

program
  .command('version')
  .description('Show the current version of KGen.')
  .action(
    actionRunner(() => {
      const require = createRequire(import.meta.url);
      const { version } = require('../package.json');
      console.log(`v${version}`);
    }),
  );

program.parse(process.argv);
