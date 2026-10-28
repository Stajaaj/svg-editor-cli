import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = resolve(process.cwd(), 'src');

const ALLOWED: Record<string, readonly string[]> = {
  root: ['cli'],
  errors: [],
  util: ['errors'],
  shapes: ['errors', 'util', 'shapes'],
  core: ['errors', 'util', 'shapes', 'core'],
  commands: ['errors', 'util', 'shapes', 'core', 'commands'],
  io: ['errors', 'util', 'shapes', 'core', 'io'],
  cli: ['errors', 'util', 'shapes', 'core', 'commands', 'io', 'cli'],
};

function listTypeScriptFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTypeScriptFiles(fullPath));
    } else if (entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function moduleName(relativePath: string): string {
  return relativePath.includes('/') ? relativePath.split('/')[0]! : 'root';
}

describe('architecture rules', () => {
  it('keeps dependencies pointing from cli down to shapes', () => {
    const violations: string[] = [];
    for (const file of listTypeScriptFiles(SRC_ROOT)) {
      const fileRelative = relative(SRC_ROOT, file).split(sep).join('/');
      const sourceModule = moduleName(fileRelative);
      const content = readFileSync(file, 'utf8');
      const specifiers: string[] = [];
      for (const match of content.matchAll(
        /\bfrom\s+['"]([^'"]+)['"]|\bimport\s+['"]([^'"]+)['"]/g,
      )) {
        specifiers.push(match[1] ?? match[2]!);
      }
      for (const specifier of specifiers) {
        if (!specifier.startsWith('.')) {
          continue;
        }
        const targetRelative = relative(
          SRC_ROOT,
          resolve(dirname(file), specifier),
        )
          .split(sep)
          .join('/');
        const targetModule = moduleName(targetRelative);
        const allowed = ALLOWED[sourceModule];
        if (!allowed) {
          violations.push(`${fileRelative}: unknown source module ${sourceModule}`);
          continue;
        }
        if (!allowed.includes(targetModule)) {
          violations.push(
            `${fileRelative} -> ${specifier} (${sourceModule} -> ${targetModule})`,
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('keeps one class per file with a matching filename', () => {
    const violations: string[] = [];
    for (const file of listTypeScriptFiles(SRC_ROOT)) {
      const content = readFileSync(file, 'utf8');
      const classes = [...content.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)/g)].map(
        (match) => match[1]!,
      );
      const expected = basename(file, '.ts');
      if (classes.length > 1) {
        violations.push(`${file}: multiple classes ${classes.join(', ')}`);
      } else if (classes.length === 1 && classes[0] !== expected) {
        violations.push(`${file}: class ${classes[0]} does not match filename`);
      }
    }
    expect(violations).toEqual([]);
  });
});
