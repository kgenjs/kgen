import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import objectPath from 'object-path';

export const defaultConfig = {
  downloadHost: 'https://github.com',
} as const;

type PathImpl<T, K extends keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? T[K] extends ArrayLike<any>
      ? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
      : K | `${K}.${PathImpl<T[K], keyof T[K]>}`
    : K
  : never;

type Path<T> = PathImpl<T, keyof T> | keyof T;

type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;

export const configFilePath = path.join(os.homedir(), '.kgen.json');

export const config = JSON.parse(
  fs.existsSync(configFilePath) ? fs.readFileSync(configFilePath).toString() : '{}',
);

export const getConfig = <P extends Path<typeof defaultConfig>>(
  p: P,
): PathValue<typeof defaultConfig, P> => {
  const curDefault = objectPath.get(defaultConfig, p);
  return objectPath.get(config, p, curDefault);
};

export const setConfig = <P extends Path<typeof defaultConfig>>(
  p: P,
  value: PathValue<typeof defaultConfig, P>,
): PathValue<typeof defaultConfig, P> => objectPath.set(config, p, value);

export const saveConfig = () => {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
};

if (!fs.existsSync(configFilePath)) {
  saveConfig();
}
