// Lets the server import the app's own game rules from tara/src: maps the app's `@/` alias to tara/src and adds the
// `.ts` extension the app's imports leave off. Loaded with `node --import ./app_paths.mjs`.
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP_SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'tara', 'src');

const hooks = `
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const APP_SRC = ${JSON.stringify(APP_SRC)};
export async function resolve(specifier, context, next) {
  let target = specifier.startsWith('@/') ? pathToFileURL(APP_SRC + '/' + specifier.slice(2)).href : specifier;
  if ((target.startsWith('file:') || target.startsWith('.')) && !/\\.[cm]?[jt]s$/.test(target)) {
    const url = new URL(target, context.parentURL);
    if (existsSync(fileURLToPath(url) + '.ts')) target = url.href + '.ts';
  }
  return next(target, context);
}
`;

register(`data:text/javascript,${encodeURIComponent(hooks)}`, pathToFileURL('./'));
