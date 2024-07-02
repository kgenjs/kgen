import Axios from 'axios';
import * as fs from 'fs';
import JSZip from 'jszip';
import * as path from 'path';
import * as stream from 'stream';
import * as url from 'url';
import { promisify } from 'util';
import { getConfig } from './config.js';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __filename = url.fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(__filename);

const finished = promisify(stream.finished);

export type DownloadFileResult = {
  status: 'success' | 'error';
  msg: string;
};

export const downloadFile = async (fileUrl: string, dest: string): Promise<DownloadFileResult> => {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest);
  }
  const writer = fs.createWriteStream(dest);

  const response = await Axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
    validateStatus: () => true,
  });

  if (response.status === 404) {
    return {
      status: 'error',
      msg: `Cannot find the target template with URL ${fileUrl}.`,
    };
  }

  response.data.pipe(writer);
  await finished(writer);

  return {
    status: 'success',
    msg: 'Success.',
  };
};

export const unzipFile = async (filepath: string, dest: string, folderName?: string) => {
  const data = fs.readFileSync(filepath);
  const zip = new JSZip();
  const contents = await zip.loadAsync(data);
  let rootPath: string = null;

  await Promise.all(
    Object.keys(contents.files).map(async (zippedPath) => {
      const parts = zippedPath.split('/');
      const filename = parts[parts.length - 1];
      // eslint-disable-next-line prefer-destructuring
      rootPath = parts[0];

      if (!filename) {
        return;
      }

      const zipLocation = zip.file(zippedPath);
      const content = await zipLocation.async('nodebuffer');

      if (!fs.existsSync(path.join(dest, path.dirname(zippedPath)))) {
        fs.mkdirSync(path.join(dest, path.dirname(zippedPath)), { recursive: true });
      }

      fs.writeFileSync(path.join(dest, zippedPath), content);
    }),
  );

  let zippedLocation = path.join(dest, rootPath);
  if (folderName) {
    zippedLocation = path.join(dest, folderName);
    if (fs.existsSync(zippedLocation)) {
      fs.rmSync(zippedLocation, { recursive: true, force: true });
    }
    fs.renameSync(path.join(dest, rootPath), zippedLocation);
  }
  return zippedLocation;
};

export type DownloadTemplateResult =
  | {
      status: 'success';
      loc: string;
    }
  | {
      status: 'error';
      msg: string;
    };

export const downloadTemplate = async (template: string): Promise<DownloadTemplateResult> => {
  // defaulting to `kgenjs` if no owner is provided
  const owner = template.includes('/') ? template.split('/')[0] : `kgenjs`;
  const repo = `kgen-template-${template.includes('/') ? template.split('/')[1] : template}`;

  const downloadHost = getConfig('downloadHost');
  const downloadURL = `${downloadHost}/${owner}/${repo}/archive/refs/heads/main.zip`;
  const archivePath = path.join(__dirname, `../templates/${owner}-${repo}.zip`);
  const destPath = path.join(__dirname, `../templates/`);

  let res = null;

  try {
    res = await downloadFile(downloadURL, archivePath);
  } catch (e) {
    fs.rmSync(archivePath);
    return {
      status: 'error',
      msg: `Failed to download template from ${downloadURL}: ${e.message}`,
    };
  }

  if (res.status === 'error') {
    return {
      status: 'error',
      msg: res.msg,
    };
  }

  const loc = await unzipFile(archivePath, destPath, `${owner}-${template.split('/')[1]}`);
  fs.rmSync(archivePath);

  return {
    status: 'success',
    loc,
  };
};
