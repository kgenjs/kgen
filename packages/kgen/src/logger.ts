import chalk from 'chalk';

export type LogResult =
  | {
      msg: string;
      status: 'error' | 'warn';
    }
  | {
      status: 'success';
    };

export type LogOptions = {
  level?: 'info' | 'warn' | 'error' | 'debug';
};

const logColorMapping = {
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
  debug: chalk.magenta,
};

export const log = (msg: string, { level = 'info' }: LogOptions = {}) => {
  console.log(`${logColorMapping[level](level.toUpperCase())} - ${msg}`);
};
