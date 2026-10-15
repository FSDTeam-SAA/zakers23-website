const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync('src/app/api/inquiry/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup(response, apiKey = 'test-key', envOverrides = {}) {
  const calls = [];
  const sandbox = {
    exports: {}, require, Buffer, AbortSignal,
    process: { env: { FOLLOWUP_BOSS_API_KEY: apiKey, ...envOverrides } },
    console: { error() {}, warn() {} },
    fetch: async (url, init) => {
      calls.push({ url, ...init, payload: JSON.parse(init.body) });
      if (typeof response === 'function') {
        return response(url, init);
      }
      if (response instanceof Error) throw response;
      return response;
    },
  };
  const access = { ...sandbox, exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/server/inquiry-access.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, access);
  sandbox.require = (name) => name === '../../../lib/server/inquiry-access' ? access.exports : require(name);
  vm.runInNewContext(source, sandbox);
  return { calls, post: (body) => sandbox.exports.POST({ json: async () => body }) };
}

const inquiry = {
  name: 'Test Buyer', email: ' BUYER@example.com ', phone: '+1 555 010 1234',
  message: 'I would like a private tour.', source: 'Website',
  pageUrl: 'https://example.com/property/test-property',
  details: { Budget: '$3M to $5M', 'Primary goal': 'Vacation home', Timeline: '1–2 years', 'Interested in': 'Test property' },
};

for (const status of [200, 201]) {
  test(`saves all consultation fields in one event (${status})`, async () => {
    const { post, calls } = setup(new Response(JSON.stringify({ id: 123 }), { status }));
    const response = await post(inquiry);
    assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie');
    assert.ok(cookie.includes('inquiry-access='));
    assert.ok(cookie.includes('HttpOnly'));
    assert.ok(cookie.includes('Max-Age=31536000'));
    assert.equal((await response.json()).success, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.followupboss.com/v1/events');
    const { person, message, type } = calls[0].payload;
    assert.equal(type, 'General Inquiry');
    assert.equal(person.firstName, 'Test');
    assert.equal(person.lastName, 'Buyer');
    assert.equal(person.emails[0].value, 'buyer@example.com');
    assert.equal(person.phones[0].value, inquiry.phone);
    for (const value of [inquiry.name, inquiry.phone, inquiry.message, inquiry.pageUrl, ...Object.values(inquiry.details)]) assert.ok(message.includes(value));
  });
}
for (const status of [204, 400, 401, 429, 500]) {
  test(`does not claim success when FUB ignores or rejects inquiry (${status})`, async () => {
    const { post } = setup(new Response(null, { status }));
    const response = await post(inquiry);
    assert.equal(response.status, 502);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.ok((await response.json()).error);
  });
}
test('rejects malformed input without sending it to CRM', async () => {
  for (const body of [null, [], { email: 123 }, { email: 'bad' }, { email: 'a@b.com', details: [] }]) {
    const { post, calls } = setup();
    assert.equal((await post(body)).status, 400);
    assert.equal(calls.length, 0);
  }
});
test('handles optional fields and property/neighborhood inquiry context', async () => {
  const { post, calls } = setup(new Response('{"id":123}'));
  assert.equal((await post({ email: 'a@b.com', details: { Neighborhood: 'Brickell' } })).status, 200);
  assert.ok(calls[0].payload.message.includes('Neighborhood: Brickell'));
  assert.ok(calls[0].payload.message.includes('Phone: Not provided'));
  assert.equal(calls[0].payload.person.phones, undefined);
});
test('handles missing configuration without exposing credentials', async () => {
  const { post, calls } = setup(undefined, '');
  assert.equal((await post(inquiry)).status, 503);
  assert.equal(calls.length, 0);
});
test('handles network failure and malformed success responses', async () => {
  for (const upstream of [new Error('timeout'), new Response('{}'), new Response('invalid json')]) {
    const { post } = setup(upstream);
    assert.equal((await post(inquiry)).status, 502);
  }
});

test('handles newsletter signup with tag and custom source', async () => {
  const { post, calls } = setup(new Response('{"id":456}'));
  const response = await post({
    email: 'subscriber@example.com',
    source: 'newsletter_signup',
    tag: 'newsletter',
  });
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  const { source, person, message } = calls[0].payload;
  assert.equal(source, 'newsletter_signup');
  assert.equal(person.emails[0].value, 'subscriber@example.com');
  assert.deepEqual(person.tags, ['newsletter']);
  assert.ok(message.includes('Tags: newsletter'));
  assert.ok(message.includes('Website newsletter subscription request'));
});

test('handles call and text consent (sms_consent: true) with TCPA audit trail and tag', async () => {
  const { post, calls } = setup(new Response('{"id":789}'));
  const response = await post({
    name: 'Consent Buyer',
    email: 'buyer@example.com',
    phone: '+1 305 555 0199',
    sms_consent: true,
    consentTimestamp: '2026-10-14T10:00:00.000Z',
  });
  assert.equal(response.status, 200);
  const resData = await response.json();
  assert.equal(resData.sms_consent, true);
  assert.equal(calls.length, 1);
  const { person, message, sms_consent } = calls[0].payload;
  assert.equal(sms_consent, true);
  assert.equal(person.sms_consent, true);
  assert.equal(person.smsConsent, true);
  assert.ok(person.tags.includes('sms-consent'));
  assert.equal(person.customFields['SMS Consent'], 'Yes');
  assert.ok(message.includes('Call & Text Consent (TCPA): Granted (Yes)'));
  assert.ok(message.includes('Consent Timestamp: 2026-10-14T10:00:00.000Z'));
  assert.ok(message.includes('Consent Notice:'));
});

test('handles lack of consent (sms_consent: false) without sms tag', async () => {
  const { post, calls } = setup(new Response('{"id":790}'));
  const response = await post({
    name: 'No Consent Buyer',
    email: 'buyer2@example.com',
    phone: '+1 305 555 0199',
    sms_consent: false,
  });
  assert.equal(response.status, 200);
  const resData = await response.json();
  assert.equal(resData.sms_consent, false);
  assert.equal(calls.length, 1);
  const { person, message, sms_consent } = calls[0].payload;
  assert.equal(sms_consent, false);
  assert.equal(person.sms_consent, false);
  assert.ok(!person.tags);
  assert.equal(person.customFields['SMS Consent'], 'No');
  assert.ok(message.includes('Call & Text Consent (TCPA): Not provided (No)'));
  assert.ok(!message.includes('Consent Notice:'));
});

test('rejects honeypot submission as spam without posting to Follow Up Boss', async () => {
  for (const spamPayload of [
    { ...inquiry, website: 'http://spam-bot.xyz' },
    { ...inquiry, honeypot: 'bot-fill-value' },
  ]) {
    const { post, calls } = setup(new Response('{"id":999}'));
    const response = await post(spamPayload);
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error, 'Spam detected.');
    assert.equal(calls.length, 0); // Must never call Follow Up Boss
  }
});

test('handles Cloudflare Turnstile CAPTCHA verification when TURNSTILE_SECRET_KEY is configured', async () => {
  const secretKey = 'turnstile-secret-test';

  // 1. Missing turnstile token
  {
    const { post, calls } = setup(new Response('{"id":999}'), 'test-key', { TURNSTILE_SECRET_KEY: secretKey });
    const response = await post(inquiry);
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(body.error.includes('Security check failed'));
    assert.equal(calls.length, 0);
  }

  // 2. Invalid/rejected turnstile token
  {
    const fakeRouter = (url) => {
      if (url.includes('turnstile')) {
        return new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }));
      }
      return new Response('{"id":999}');
    };
    const { post, calls } = setup(fakeRouter, 'test-key', { TURNSTILE_SECRET_KEY: secretKey });
    const response = await post({ ...inquiry, turnstileToken: 'invalid-token' });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(body.error.includes('Security check failed'));
    assert.equal(calls.length, 1); // Only called Cloudflare, never FUB
    assert.ok(calls[0].url.includes('challenges.cloudflare.com/turnstile'));
  }

  // 3. Valid turnstile token passes and posts to Follow Up Boss
  {
    const fakeRouter = (url) => {
      if (url.includes('turnstile')) {
        return new Response(JSON.stringify({ success: true }));
      }
      return new Response('{"id":999}');
    };
    const { post, calls } = setup(fakeRouter, 'test-key', { TURNSTILE_SECRET_KEY: secretKey });
    const response = await post({ ...inquiry, turnstileToken: 'valid-token' });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(calls.length, 2); // First Cloudflare, then FUB
    assert.ok(calls[0].url.includes('challenges.cloudflare.com/turnstile'));
    assert.equal(calls[0].payload.secret, secretKey);
    assert.equal(calls[0].payload.response, 'valid-token');
    assert.ok(calls[1].url.includes('api.followupboss.com'));
  }
});

test('tags every lead with source, project name, button clicked and UTM parameters', async () => {
  const { post, calls } = setup(new Response('{"id":888}'));
  const response = await post({
    name: 'Campaign Buyer',
    email: 'campaign@example.com',
    phone: '+1 305 555 9999',
    pageUrl: 'https://zakers23.com/properties/luxury-home',
    projectName: 'Luxury Home Project',
    buttonClicked: 'Inquire',
    utm_source: 'facebook',
    utm_medium: 'paid_social',
    utm_campaign: 'summer2026',
    utm_term: 'luxury-condo',
    utm_content: 'ad-v1',
  });

  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  const { person, message, pageUrl, projectName, buttonClicked, utm_source, utm_medium, utm_campaign } = calls[0].payload;

  // Custom fields
  assert.equal(person.customFields['Project Name'], 'Luxury Home Project');
  assert.equal(person.customFields['Button Clicked'], 'Inquire');
  assert.equal(person.customFields['Page URL'], 'https://zakers23.com/properties/luxury-home');
  assert.equal(person.customFields['UTM Source'], 'facebook');
  assert.equal(person.customFields['UTM Medium'], 'paid_social');
  assert.equal(person.customFields['UTM Campaign'], 'summer2026');
  assert.equal(person.customFields['UTM Term'], 'luxury-condo');
  assert.equal(person.customFields['UTM Content'], 'ad-v1');

  // Tags
  assert.ok(person.tags.includes('Luxury Home Project'));
  assert.ok(person.tags.includes('Inquire'));
  assert.ok(person.tags.includes('facebook'));
  assert.ok(person.tags.includes('summer2026'));

  // Top level event fields
  assert.equal(pageUrl, 'https://zakers23.com/properties/luxury-home');
  assert.equal(projectName, 'Luxury Home Project');
  assert.equal(buttonClicked, 'Inquire');
  assert.equal(utm_source, 'facebook');
  assert.equal(utm_medium, 'paid_social');
  assert.equal(utm_campaign, 'summer2026');

  // Message lines for Zach
  assert.ok(message.includes('Project Name: Luxury Home Project'));
  assert.ok(message.includes('Button Clicked: Inquire'));
  assert.ok(message.includes('Page: https://zakers23.com/properties/luxury-home'));
  assert.ok(message.includes('utm_source: facebook'));
  assert.ok(message.includes('utm_medium: paid_social'));
  assert.ok(message.includes('utm_campaign: summer2026'));
});




test('property access rejects missing, forged, malformed and expired cookies', () => {
  const sandbox = { exports: {}, require, Buffer, process: { env: { FOLLOWUP_BOSS_API_KEY: 'test-key' } } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/server/inquiry-access.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, sandbox);
  const { createInquiryAccess, hasInquiryAccess, INQUIRY_ACCESS_MAX_AGE } = sandbox.exports;
  const now = 1800000000000;
  const token = createInquiryAccess(123, now);
  assert.equal(hasInquiryAccess(token, now), true);
  assert.equal(hasInquiryAccess(token, now + INQUIRY_ACCESS_MAX_AGE * 1000), false);
  for (const invalid of [undefined, '', 'true', '9999999999.fake', token + '.extra', token.replace(/^./, '9')]) {
    assert.equal(hasInquiryAccess(invalid, now), false);
  }
  sandbox.process.env.FOLLOWUP_BOSS_API_KEY = 'different-key';
  assert.equal(hasInquiryAccess(token, now), false);
});
