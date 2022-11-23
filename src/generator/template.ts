import * as fs from 'fs';
import { globby } from 'globby';
import * as path from 'path';
import { GenerateResult } from '.';

export type OverrideTemplate = {
  filepath: string;
  content: string;
};

type IgnoreChecker = (filepath: string) => boolean | Promise<boolean>;

export type CreateTemplateOptions = {
  template: string;
  overrides?: OverrideTemplate[];
  ignore?: string | IgnoreChecker;
};

type WalkDirCallback = (props: { filepath: string; fullFilepath: string; isDir: boolean }) => void;

const walkDir = (target: string, base: string, callback: WalkDirCallback) => {
  callback({
    filepath: path.join('./', path.relative(base, target)),
    fullFilepath: target,
    isDir: fs.lstatSync(target).isDirectory(),
  });
  if (fs.lstatSync(target).isDirectory()) {
    fs.readdirSync(target).forEach((dir) => {
      walkDir(path.join(target, dir), base, callback);
    });
  }
};

export const createFromTemplate = async (
  targetPath: string,
  { template: templatePath, overrides = [], ignore: userIgnore }: CreateTemplateOptions,
): Promise<GenerateResult> => {
  if (fs.existsSync(targetPath)) {
    return {
      status: 'error',
      msg: 'Target path already exists.',
    };
  }

  let ignore: string[] | IgnoreChecker = [];

  if (typeof userIgnore === 'string') {
    ignore = await globby(userIgnore, {
      cwd: templatePath,
    });
  } else if (userIgnore) {
    ignore = userIgnore;
  }

  walkDir(templatePath, templatePath, async ({ filepath, fullFilepath, isDir }) => {
    if (!Array.isArray(ignore) && (await ignore(filepath))) return;
    if (Array.isArray(ignore) && ignore.includes(filepath)) return;

    const generatedPath = path.join(targetPath, filepath);

    if (isDir) {
      fs.mkdirSync(generatedPath, { recursive: true });
      return;
    }

    let fileContent = fs.readFileSync(fullFilepath, {
      encoding: 'utf-8',
    });

    await Promise.all(
      overrides.map(async (override) => {
        if (
          (
            await globby(override.filepath, {
              cwd: templatePath,
            })
          ).includes(filepath)
        ) {
          if (typeof override.content !== 'string') {
            fileContent = JSON.stringify(override.content);
          } else {
            fileContent = override.content;
          }
        }
      }),
    );

    fs.writeFileSync(generatedPath, fileContent);
  });

  return {
    status: 'success',
  };
};
