import { log } from '@kgen/core';
import chalk from 'chalk';

const actionRunner =
  (fn: (...args: any[]) => Promise<any> | any) =>
  async (...args: any[]) => {
    try {
      await fn(...args);
    } catch (err) {
      log(`An error occured while executing: ${err.message}`, {
        level: 'error',
      });
      console.log(chalk.gray(err.stack));
      console.log(
        chalk.red(
          'This is most likely due to an inner failure of KGen, please submit a new issue at https://github.com/kgenjs/kgen',
        ),
      );
    }
  };

export default actionRunner;
