import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { parse } from 'vue/compiler-sfc';

const source = readFileSync(new URL('../src/views/ConfigPage.vue', import.meta.url), 'utf8');
const { descriptor, errors } = parse(source);
assert.deepEqual(errors, []);
const compiled = ts.transpileModule(descriptor.script.content, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports, require: () => ({}) });
const updateConfig = module.exports.default.methods.updateConfig;

test('configuration save submits an isolated snapshot of the selected profile and blocks repeated clicks', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const calls = [];
  const page = {
    fetched: true, savingConfig: false, isSystemConfig: false, selectedConfigID: 'group-profile',
    config_data: { provider_settings: { enable: true } },
    async saveAstrbotConfig(payload) { calls.push(payload); await pending; return { success: true }; },
  };
  const saving = updateConfig.call(page);
  await updateConfig.call(page);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].conf_id, 'group-profile');
  page.config_data.provider_settings.enable = false;
  assert.equal(calls[0].config.provider_settings.enable, true);
  release();
  assert.equal((await saving).success, true);
  assert.equal(page.savingConfig, false);
});

test('configuration save releases its loading state after a failure', async () => {
  const page = {
    fetched: true, savingConfig: false, config_data: {}, selectedConfigID: 'default',
    async saveAstrbotConfig() { throw new Error('fixture failure'); },
  };
  await assert.rejects(updateConfig.call(page), /fixture failure/);
  assert.equal(page.savingConfig, false);
});

test('system configuration and two-factor follow-up retain the existing save path', async () => {
  const page = {
    fetched: true, savingConfig: false, config_data: {}, isSystemConfig: true,
    async saveAstrbotConfig(payload) { assert.equal(payload.conf_id, 'default'); return { requires2fa: true }; },
  };
  assert.equal((await updateConfig.call(page)).requires2fa, true);
  assert.equal(page.savingConfig, false);
});
