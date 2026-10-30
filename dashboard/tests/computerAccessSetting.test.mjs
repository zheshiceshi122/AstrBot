import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { parse } from "vue/compiler-sfc";
import * as vue from "vue";

const source = readFileSync(
  new URL(
    "../src/components/shared/ComputerAccessSetting.vue",
    import.meta.url,
  ),
  "utf8",
);
const { descriptor } = parse(source);
const compiled = ts.transpileModule(
  `${descriptor.scriptSetup.content}\nexport { load, save, runtime, enabled, loading, saving, loadFailed, error };`,
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;

function setup() {
  let profile = {
    provider_settings: { computer_use_runtime: "sandbox", identifier: true },
    other: "original",
  };
  let loadError = false,
    saveError = false,
    pending;
  const writes = [];
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require(name) {
      if (name === "vue") return { ...vue, onMounted() {} };
      if (name === "@/i18n/composables")
        return {
          useI18n: () => ({ t: (key) => key }),
          useModuleI18n: () => ({ tm: (key) => key }),
        };
      if (name === "@/api/v1")
        return {
          configProfileApi: {
            async get(id) {
              assert.equal(id, "default");
              return {
                data: loadError
                  ? { status: "error", message: "read failed" }
                  : {
                      status: "ok",
                      data: { config: structuredClone(profile) },
                    },
              };
            },
            async update(id, data) {
              assert.equal(id, "default");
              writes.push(structuredClone(data));
              if (pending) await pending;
              if (saveError)
                return { data: { status: "error", message: "write failed" } };
              profile = structuredClone(data);
              return { data: { status: "ok" } };
            },
          },
        };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return {
    api: module.exports,
    writes,
    profile,
    failRead() {
      loadError = true;
    },
    failWrite() {
      saveError = true;
    },
    delay(value) {
      pending = value;
    },
  };
}

test("opening settings preserves sandbox mode and never writes a profile", async () => {
  const { api, writes } = setup();
  await api.load();
  assert.equal(api.runtime.value, "sandbox");
  assert.equal(api.enabled.value, true);
  assert.equal(writes.length, 0);
});

test("changing access reads the latest default profile and preserves unrelated fields", async () => {
  const { api, writes, profile } = setup();
  await api.load();
  profile.other = "newer server value";
  await api.save(false);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].provider_settings.computer_use_runtime, "none");
  assert.equal(writes[0].provider_settings.identifier, true);
  assert.equal(writes[0].other, "newer server value");
});

test("failed access changes restore the displayed switch and release the save state", async () => {
  const { api, failWrite } = setup();
  await api.load();
  failWrite();
  api.enabled.value = false;
  await api.save(false);
  assert.equal(api.enabled.value, true);
  assert.equal(api.runtime.value, "sandbox");
  assert.equal(api.saving.value, false);
  assert.equal(api.error.value, "write failed");
});

test("read failures and repeated clicks cannot submit an extra access change", async () => {
  const failed = setup();
  failed.failRead();
  await failed.api.load();
  await failed.api.save(true);
  assert.equal(failed.api.loadFailed.value, true);
  assert.equal(failed.writes.length, 0);
  const busy = setup();
  await busy.api.load();
  let release;
  busy.delay(
    new Promise((resolve) => {
      release = resolve;
    }),
  );
  const first = busy.api.save(false);
  await busy.api.save(true);
  release();
  await first;
  assert.equal(busy.writes.length, 1);
});
