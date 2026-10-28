import { describe, expect, it } from 'vitest';
import { CommandLineParser } from '../src/cli/CommandLineParser';

describe('CommandLineParser', () => {
  const parser = new CommandLineParser();

  it('ignores empty lines and comments', () => {
    expect(parser.parse('')).toBeNull();
    expect(parser.parse('   ')).toBeNull();
    expect(parser.parse('# comment')).toBeNull();
    expect(parser.parse('   # comment')).toBeNull();
  });

  it('splits words and keeps quoted tokens intact', () => {
    expect(parser.parse('create text t 10 20 "My Diagram"')).toEqual([
      { value: 'create', quoted: false },
      { value: 'text', quoted: false },
      { value: 't', quoted: false },
      { value: '10', quoted: false },
      { value: '20', quoted: false },
      { value: 'My Diagram', quoted: true },
    ]);
  });

  it('supports escaped quotes, escaped backslashes and empty quoted strings', () => {
    expect(parser.parse('set t text "say \\"hi\\""')).toEqual([
      { value: 'set', quoted: false },
      { value: 't', quoted: false },
      { value: 'text', quoted: false },
      { value: 'say "hi"', quoted: true },
    ]);
    expect(parser.parse('read "C:\\Program Files\\a.svg"')).toEqual([
      { value: 'read', quoted: false },
      { value: 'C:\\Program Files\\a.svg', quoted: true },
    ]);
    expect(parser.parse('create text t 1 2 ""')).toEqual([
      { value: 'create', quoted: false },
      { value: 'text', quoted: false },
      { value: 't', quoted: false },
      { value: '1', quoted: false },
      { value: '2', quoted: false },
      { value: '', quoted: true },
    ]);
  });

  it('rejects unclosed quotes', () => {
    expect(() => parser.parse('create text t 1 2 "oops')).toThrow(
      'invalid syntax: unclosed quote',
    );
  });
});
