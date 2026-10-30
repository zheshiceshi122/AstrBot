import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as vue from 'vue';

const source = readFileSync(new URL('../src/composables/useProviderSources.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup({ sourceError = false, modelError = false, profileError = false, runner = 'local', existing, delayedSave } = {}) {
  const calls = [];
  const records = { sources: [], models: existing ? [structuredClone(existing)] : [] };
  const profile = {
    admins_id: ['fixture-admin'],
    provider_settings: { enable: true },
    agent_runner: { runner_type: runner, config: { model: { provider_id: 'previous-model', fallback_provider_ids: ['backup'] }, persona: { persona_id: 'keep-me' } } },
  };
  let writtenProfile;
  let failModel = modelError;
  let failProfile = profileError;
  const ok = (data = {}) => ({ data: { status: 'ok', data } });
  const providerApi = {
    async upsertSource(id, data) {
      calls.push(['source', id, structuredClone(vue.toRaw(data))]);
      if (delayedSave) await delayedSave;
      if (sourceError) return { data: { status: 'error', message: 'fixture source failure' } };
      records.sources = [structuredClone(vue.toRaw(data))];
      return ok();
    },
    async schema() {
      calls.push(['schema']);
      return ok({ provider_sources: structuredClone(records.sources), providers: structuredClone(records.models) });
    },
    async createInSource(id, data) {
      calls.push(['model', id, structuredClone(data)]);
      if (failModel) return { data: { status: 'error', message: 'fixture model failure' } };
      records.models.push(structuredClone(data));
      return ok();
    },
    async setEnabled(id, data) {
      calls.push(['enable', id, data]);
      records.models.find(model => model.id === id).enable = data.enabled;
      return ok();
    },
  };
  const configProfileApi = {
    async list() { return ok({ info_list: [{ id: 'group-profile', name: 'Group profile' }] }); },
    async get(id) { calls.push(['get-profile', id]); return ok({ config: structuredClone(profile) }); },
    async update(id, data) {
      calls.push(['apply', id]);
      if (failProfile) throw new Error('fixture profile failure');
      writtenProfile = structuredClone(data);
      return ok();
    },
  };
  const module = { exports: {} };
  const scope = vm.createContext({
    exports: module.exports, module,
    require(name) {
      if (name === 'vue') return { ...vue, onMounted() {} };
      if (name === '@/api/v1') return { providerApi, configProfileApi };
      if (name.endsWith('providerUtils')) return { getProviderIcon() {}, isMonochromeProviderIcon() {} };
      if (name.endsWith('confirmDialog')) return { useConfirmDialog() {} };
      if (name.endsWith('inputValue')) return { normalizeTextInput: value => typeof value === 'string' ? value : '' };
      if (name.endsWith('sponsorCatalog')) return { sponsorCatalog: vue.ref(null) };
      if (name.endsWith('composables')) return { useI18n: () => ({ locale: vue.ref('en-US') }) };
      throw new Error(`Unexpected import ${name}`);
    },
    console,
  });
  vm.runInContext(compiled, scope);
  const api = module.exports.useProviderSources({
    tm: (key, args) => `${key}${args ? JSON.stringify(args) : ''}`,
    showMessage() {},
  });
  api.providerTemplates.value = {
    Compatible: { id: 'example', type: 'openai_chat_completion', provider_type: 'chat_completion', provider: 'openai', api_base: 'https://api.example.com/v1', key: [] },
  };
  api.addProviderSource('Compatible');
  api.editableProviderSource.value.key = ['fixture-primary', 'fixture-secondary'];
  api.connection.value.model = 'fixture-model';
  api.connection.value.profileId = 'group-profile';
  return { api, calls, records, profile, written: () => writtenProfile, fixModel: () => { failModel = false; }, fixProfile: () => { failProfile = false; } };
}

test('one save creates the connection and model, then applies only the selected profile', async () => {
  const state = setup();
  await state.api.loadConnectionProfiles();
  await state.api.saveConnection();
  assert.deepEqual(state.calls.map(call => call[0]), ['source', 'schema', 'model', 'schema', 'get-profile', 'apply']);
  assert.equal(state.calls.find(call => call[0] === 'apply')[1], 'group-profile');
  assert.equal(state.written().agent_runner.config.model.provider_id, 'example/fixture-model');
  assert.deepEqual(state.written().agent_runner.config.persona, state.profile.agent_runner.config.persona);
  assert.deepEqual(state.written().agent_runner.config.model.fallback_provider_ids, ['backup']);
  assert.deepEqual(state.written().admins_id, ['fixture-admin']);
  assert.deepEqual(state.records.sources[0].key, ['fixture-primary', 'fixture-secondary']);
  assert.equal(state.api.connection.value.failed, false);
});

test('a failed source save retains the draft and never creates a model or changes a profile', async () => {
  const state = setup({ sourceError: true });
  await state.api.saveConnection();
  assert.deepEqual(state.calls.map(call => call[0]), ['source']);
  assert.equal(state.api.isSourceModified.value, true);
  assert.equal(state.api.connection.value.model, 'fixture-model');
  assert.equal(state.api.connection.value.failed, true);
  assert.equal(state.api.connection.value.result, 'fixture source failure');
  assert.equal(state.api.connection.value.busy, false);
});

test('a failed model creation stops before applying and can be saved again without recreating the source', async () => {
  const state = setup({ modelError: true });
  await state.api.saveConnection();
  assert.equal(state.calls.some(call => call[0] === 'apply'), false);
  assert.equal(state.api.connection.value.failed, true);
  state.fixModel();
  await state.api.saveConnection();
  assert.equal(state.calls.filter(call => call[0] === 'source').length, 1);
  assert.equal(state.records.models.length, 1);
  assert.ok(state.written());
});

test('a failed profile update reports partial success and a second save reuses the created model', async () => {
  const state = setup({ profileError: true });
  await state.api.saveConnection();
  assert.match(state.api.connection.value.result, /savedButNotApplied/);
  state.fixProfile();
  await state.api.saveConnection();
  assert.equal(state.calls.filter(call => call[0] === 'model').length, 1);
  assert.equal(state.calls.filter(call => call[0] === 'get-profile').length, 2);
  assert.equal(state.api.connection.value.failed, false);
});

test('save-only does not read or change a chat profile', async () => {
  const state = setup();
  state.api.connection.value.profileId = '';
  await state.api.saveConnection();
  assert.equal(state.calls.some(call => ['apply', 'get-profile'].includes(call[0])), false);
  assert.equal(state.records.models.length, 1);
  assert.match(state.api.connection.value.result, /connection.saved/);
});

test('existing model settings are preserved, and a disabled model is enabled only when applied', async () => {
  const state = setup({ existing: { id: 'custom-id', model: 'fixture-model', provider_source_id: 'example', enable: false, modalities: ['text'], max_context_tokens: 8192 } });
  state.api.providers.value = structuredClone(state.records.models);
  state.api.connection.value.profileId = '';
  await state.api.saveConnection();
  assert.equal(state.calls.some(call => call[0] === 'enable'), false);
  state.api.connection.value.profileId = 'group-profile';
  await state.api.saveConnection();
  assert.equal(state.calls.some(call => call[0] === 'model'), false);
  assert.equal(state.records.models[0].max_context_tokens, 8192);
  assert.deepEqual(state.records.models[0].modalities, ['text']);
  assert.equal(state.written().agent_runner.config.model.provider_id, 'custom-id');
  assert.equal(state.records.models[0].enable, true);
});

test('third-party agent profiles retain their runner and receive no profile write', async () => {
  const state = setup({ runner: 'dify' });
  await state.api.saveConnection();
  assert.equal(state.calls.some(call => call[0] === 'apply'), false);
  assert.match(state.api.connection.value.result, /thirdPartyRunner/);
  assert.equal(state.profile.agent_runner.runner_type, 'dify');
});

test('a second click or source switch during save cannot submit twice or redirect the pending save', async () => {
  let release;
  const state = setup({ delayedSave: new Promise(resolve => { release = resolve; }) });
  const pending = state.api.saveConnection();
  await state.api.saveConnection();
  state.api.selectProviderSource({ id: 'other' });
  assert.equal(state.api.selectedProviderSource.value.id, 'example');
  release();
  await pending;
  assert.equal(state.calls.filter(call => call[0] === 'model').length, 1);
  assert.equal(state.written().agent_runner.config.model.provider_id, 'example/fixture-model');
});
