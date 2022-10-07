import fs from 'node:fs';
import path, {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {packageExtension} from '@lvce-editor/package-extension';

const __dirname = dirname(fileURLToPath(import.meta.url));

const root = path.join(__dirname, '..');

fs.rmSync(join(root, 'dist'), {recursive: true, force: true});

fs.mkdirSync(path.join(root, 'dist'));

fs.copyFileSync(join(root, 'README.md'), join(root, 'dist', 'README.md'));
fs.copyFileSync(
	join(root, 'extension.json'),
	join(root, 'dist', 'extension.json'),
);
fs.copyFileSync(
	join(root, 'icon-theme.json'),
	join(root, 'dist', 'icon-theme.json'),
);
fs.cpSync(join(root, 'icons'), join(root, 'dist', 'icons'), {
	recursive: true,
});

await packageExtension({
	highestCompression: true,
	inDir: join(root, 'dist'),
	outFile: join(root, 'extension.tar.br'),
});
