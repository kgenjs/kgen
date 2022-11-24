import prompts from 'prompts';

const getPrompt = <T extends string = string>(
  questions: prompts.PromptObject<T>[],
  options?: prompts.Options,
) => prompts<T>(questions, options);

export default getPrompt;
