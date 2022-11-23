export type GenerateResult =
  | {
      status: 'error';
      msg: string;
    }
  | {
      status: 'success';
    };

export { createFromTemplate } from './template.js';
