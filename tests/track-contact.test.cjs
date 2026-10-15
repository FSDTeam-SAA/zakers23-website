const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const compile = (file) => ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;

function setup(status = 200, apiKey = 'test-key') {
  const calls = [];
  const base = {
    require, Buffer, AbortSignal, URL,
    process: { env: { FOLLOWUP_BOSS_API_KEY: apiKey } },
    console: { error() {}, warn() {} },
  };
  const access = { ...base, exports: {} };
  vm.runInNewContext(compile('src/lib/server/inquiry-access.ts'), access);

  const route = {
    ...base, exports: {},
    require: (name) => name === '../../../lib/server/inquiry-access' ? access.exports : require(name),
    fetch: async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return new Response(JSON.stringify({ id: 123 }), { status });
    },
  };
  vm.runInNewContext(compile('src/app/api/track-contact/route.ts'), route);

  return {
    access: access.exports,
    calls,
    post: (body, token) => route.exports.POST({
      url: 'https://example.com/api/track-contact',
      cookies: { get: () => token ? { value: token } : undefined },
      json: async () => body,
    }),
  };
}

test('records whatsapp, phone, and email clicks in Follow Up Boss for anonymous visitors', async () => {
  for (const channel of ['whatsapp', 'phone', 'email']) {
    const { post, calls } = setup();
    const response = await post({
      channel,
      destination: channel === 'whatsapp' ? 'https://wa.me/13053435371' : channel === 'phone' ? 'tel:3053435371' : 'mailto:Zakers@onesothebysrealty.com',
      pageUrl: 'https://zakers23.com/properties/luxury-home',
    });

    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.equal(data.channel, channel);
    assert.equal(data.type, `${channel}_click`);

    assert.equal(calls.length, 1);
    const event = calls[0].body;
    assert.equal(event.source, `Website (${channel.toUpperCase()})`);
    assert.equal(event.type, 'General Inquiry');
    assert.ok(event.person.tags.includes(`${channel}_click`));
    assert.ok(event.person.tags.includes('off-form-contact'));
    assert.ok(event.message.includes(`Visitor clicked ${channel.toUpperCase()}`));
    assert.ok(event.message.includes('https://zakers23.com/properties/luxury-home'));
  }
});

test('records off-form contact click attached to existing contact session (cookie)', async () => {
  const { post, calls, access } = setup();
  const token = access.createInquiryAccess(789);

  const response = await post({
    channel: 'whatsapp',
    destination: 'https://wa.me/13053435371',
    pageUrl: 'https://zakers23.com/waterfront',
  }, token);

  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  const event = calls[0].body;
  assert.equal(event.person.id, 789);
  assert.ok(event.person.tags.includes('whatsapp_click'));
  assert.ok(event.message.includes('Off-form contact event: Visitor clicked WHATSAPP'));
});

test('rejects invalid channel without CRM request', async () => {
  const { post, calls } = setup();
  for (const badBody of [null, {}, { channel: 'sms' }, { channel: 123 }]) {
    const response = await post(badBody);
    assert.equal(response.status, 400);
  }
  assert.equal(calls.length, 0);
});
