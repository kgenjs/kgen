import prompts from 'prompts';
import { log } from '../logger.js';

const getPrompt = <T extends string = string>(
  questions: prompts.PromptObject<T>[],
  options?: prompts.Options,
) =>
  prompts<T>(questions, {
    ...options,
    onCancel: () => {
      console.log();
      log('Operation canceled by user.');
      process.exit(1);
    },
  });

export default getPrompt;
