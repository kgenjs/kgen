import * as fs from 'fs';
import YAML from 'yaml';

export const loadPlainTextConfig = (filepath: string) =>
  fs.readFileSync(filepath, {
    encoding: 'utf-8',
  });

export const loadJSONConfig = (filepath: string) => {
  return JSON.parse(loadPlainTextConfig(filepath));
};

export const loadYAMLConfig = (filepath: string) => {
  return YAML.parse(loadPlainTextConfig(filepath));
};

export const mergeConfig = (original: Record<string, any>, toMerge: Record<string, any>) => {
  const result = original;
  Object.entries(toMerge).forEach(([key, value]) => {
    if (result[key] === undefined) {
      result[key] = value;
    } else if (Array.isArray(result[key])) {
      result[key] = [...result[key], ...value];
    } else if (['number', 'string', 'boolean'].includes(typeof result[key])) {
      result[key] = value;
    } else {
      result[key] = {
        ...result[key],
        ...value,
      };
    }
  });
  return result;
};
