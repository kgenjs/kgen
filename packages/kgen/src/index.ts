import { createFromTemplate as generateTemplate } from './generator/index.js';
import { CreateTemplateOptions } from './generator/template.js';
import { log } from './logger.js';

export const createFromTemplate = async (targetPath: string, options: CreateTemplateOptions) => {
  const timer = Date.now();
  const result = await generateTemplate(targetPath, options);
  if (options.noConsole) return;
  console.log();
  if (result.status === 'success') {
    log(`Template generated successfully in ${(Date.now() - timer) / 1000}s.`);
    return;
  }
  log(result.msg, {
    level: 'error',
  });
};

export { log, LogOptions } from './logger.js';
export { default as getPrompt } from './prompts/index.js';
export {
  loadPlainTextConfig,
  loadJSONConfig,
  loadYAMLConfig,
  mergeConfig,
} from './generator/index.js';
