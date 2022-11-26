import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export const configFilePath = path.join(os.homedir(), '.kgen.json');

export const config = JSON.parse(
  fs.existsSync(configFilePath) ? fs.readFileSync(configFilePath).toString() : '{}',
);

export const saveConfig = () => {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
};

if (!fs.existsSync(configFilePath)) {
  saveConfig();
}
