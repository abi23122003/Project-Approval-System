import test from 'node:test';
import assert from 'node:assert/strict';
import { toAdminCsv } from './admin-csv.mjs';

test('CSV quotes delimiters and prevents spreadsheet formula execution', () => {
  assert.equal(toAdminCsv([
    ['Name', 'Details'],
    ['Ada, Lovelace', 'She said "hello"'],
    ['=HYPERLINK("https://example.invalid")', null],
  ]), '"Name","Details"\r\n"Ada, Lovelace","She said ""hello"""\r\n"\'=HYPERLINK(""https://example.invalid"")",""');
});
