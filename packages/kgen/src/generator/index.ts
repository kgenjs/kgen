export type GenerateResult =
  | {
      status: 'error';
      msg: string;
    }
  | {
      status: 'success';
    };

export { createFromTemplate } from './template.js';
export { loadPlainTextConfig, loadJSONConfig, loadYAMLConfig, mergeConfig } from './config.js';
