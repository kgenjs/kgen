import Axios from 'axios';
import * as fs from 'fs';
import * as stream from 'stream';
import * as path from 'path';
import * as https from 'https';
import * as url from 'url';
import { promisify } from 'util';
import JSZip from 'jszip';
import { config } from './config.js';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __filename = url.fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __dirname = path.dirname(__filename);

const finished = promisify(stream.finished);

export const downloadFile = async (fileUrl: string, dest: string): Promise<any> => {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest);
  }
  const writer = fs.createWriteStream(dest);
  return Axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  }).then((response) => {
    response.data.pipe(writer);
    return finished(writer);
  });
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

export const downloadTemplate = async (template: string) => {
  const owner = template.split('/')[0];
  const repo = `kgen-template-${template.split('/')[1]}`;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const { downloadHost = 'https://github.com' } = config;
  const downloadURL = `${downloadHost}/${owner}/${repo}/archive/refs/heads/main.zip`;
  const archivePath = path.join(__dirname, `../templates/${owner}-${repo}.zip`);
  const destPath = path.join(__dirname, `../templates/`);

  await downloadFile(downloadURL, archivePath);
  const loc = await unzipFile(archivePath, destPath, `${owner}-${template.split('/')[1]}`);
  fs.rmSync(archivePath);

  return loc;
};
