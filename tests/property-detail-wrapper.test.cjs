const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

test('PropertyDetailWrapper source code does not invoke router.refresh on 401 or loop', () => {
  const content = fs.readFileSync('src/features/Property/components/PropertyDetailWrapper.tsx', 'utf8');
  assert.equal(content.includes('router.refresh()'), false, 'PropertyDetailWrapper must not call router.refresh()');
  assert.equal(content.includes('PropertyInquiryGate'), false, 'PropertyDetailWrapper should not reference deleted gate');
  assert.ok(content.includes('!hasAccess'), 'PropertyDetailWrapper guards visit tracking behind hasAccess');
});

test('Property page Page() does not generate dynamic Date.now() for anonymous expiresAt', () => {
  const pageContent = fs.readFileSync('src/app/property/[slug]/page.tsx', 'utf8');
  assert.equal(pageContent.includes('Date.now()'), false, 'page.tsx must not pass dynamic Date.now() timestamp to avoid reload loop');
  assert.ok(pageContent.includes('hasAccess={Boolean(access)}'), 'page.tsx must pass hasAccess boolean');
});

test('MLS feed photo URLs (api.cotality.com) are not blocked or replaced with no-image placeholder', () => {
  const imageUtilsContent = fs.readFileSync('src/lib/image-utils.ts', 'utf8');
  assert.equal(imageUtilsContent.includes('trimmed.includes("api.cotality.com")'), false, 'image-utils must not block api.cotality.com');

  const propDetailContent = fs.readFileSync('src/features/Property/components/PropertyDetailPage.tsx', 'utf8');
  assert.equal(propDetailContent.includes('path.includes("api.cotality.com")'), false, 'PropertyDetailPage must not reject api.cotality.com in getImageUrl');
  assert.equal(propDetailContent.includes('!url.includes("api.cotality.com")'), false, 'PropertyDetailPage must not filter out api.cotality.com');

  const idxContent = fs.readFileSync('src/lib/server/idx-properties.ts', 'utf8');
  assert.equal(idxContent.includes('trimmed.includes("api.cotality.com")'), false, 'idx-properties must not reject api.cotality.com in normalizeFraserUrl');
});

test('Property detail page and fallbacks show only each listing own photos without attaching Waldorf Astoria images', () => {
  const propDetail = fs.readFileSync('src/features/Property/components/PropertyDetailPage.tsx', 'utf8');
  assert.equal(propDetail.includes('"https://frasermiami.s3.amazonaws.com/waldorf/waldorf-astoria-hero-twilight.webp"'), false, 'fallbackImages must not include Waldorf Astoria');
  assert.ok(propDetail.includes('isWaldorf'), 'PropertyDetailPage must check if listing is Waldorf before allowing waldorf images');

  const idxContent = fs.readFileSync('src/lib/server/idx-properties.ts', 'utf8');
  assert.equal(idxContent.includes('for (let i = 1; i <= 3; i++) {'), false, 'extractImage must not inject foreign luxury fallbacks into gallery');

  const waterfrontMls = JSON.parse(fs.readFileSync('src/data/waterfront-mls.json', 'utf8'));
  const matheson = waterfrontMls.find((p) => p.slug === '485-w-matheson-drive-a12005335');
  assert.ok(matheson, '485 W Matheson Drive listing must exist');
  assert.ok(matheson.img.includes('api.cotality.com'), '485 W Matheson primary photo must be from its MLS feed');
  assert.ok(matheson.imgs.every((url) => !url.includes('waldorf')), '485 W Matheson must not have any Waldorf images');
  assert.ok(matheson.imgs.some((url) => url.includes('api.cotality.com')), '485 W Matheson gallery must include its own MLS feed photos');

  const hasAnyWaldorf = waterfrontMls.some((p) =>
    (p.img && p.img.includes('waldorf')) ||
    (Array.isArray(p.imgs) && p.imgs.some((u) => u.includes('waldorf')))
  );
  assert.equal(hasAnyWaldorf, false, 'waterfront-mls.json must not attach Waldorf Astoria images to any listing');
});

