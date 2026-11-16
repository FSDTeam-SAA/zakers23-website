const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('PropertyDetailSkeleton does not contain intrusive floating loading pill', () => {
  const content = fs.readFileSync('src/features/Property/components/PropertyDetailSkeleton.tsx', 'utf8');
  assert.equal(content.includes('Curating luxury residence specifications...'), false, 'Should not contain Curating luxury text');
  assert.equal(content.includes('Loading Property Details...'), false, 'Should not contain Loading Property Details text');
});

test('PropertyDetailPage pricing table handles null beds and baths by displaying Inquire', () => {
  const content = fs.readFileSync('src/features/Property/components/PropertyDetailPage.tsx', 'utf8');
  assert.equal(content.includes('${plan.beds} Bed` : "—"} · ${plan.baths} Bath` : "—"}'), false, 'Should not have raw null Bed · null Bath interpolation');
  assert.ok(content.includes('formatPlanBedsBaths'), 'Should use formatPlanBedsBaths helper');
  assert.ok(content.includes('Inquire'), 'formatPlanBedsBaths must render Inquire for empty bed/bath');
});

test('PropertyDetailPage labels height and stories accurately as stories', () => {
  const content = fs.readFileSync('src/features/Property/components/PropertyDetailPage.tsx', 'utf8');
  assert.equal(content.includes('${project.height} FT'), false, 'Should not naively append FT to stories count');
  assert.ok(content.includes('storiesHeightText'), 'Should compute storiesHeightText');
  assert.ok(content.includes('${project.stories} stories'), 'Should label stories in lowercase/standard stories');
});

test('PropertyDetailPage formats bedroom range and hides blank specs', () => {
  const content = fs.readFileSync('src/features/Property/components/PropertyDetailPage.tsx', 'utf8');
  assert.ok(content.includes('bedroomText'), 'Should compute bedroomText range');
  assert.ok(content.includes('${min} to ${max} bedrooms'), 'Should format bedroom range as "min to max bedrooms"');
  assert.ok(content.includes('{bedroomText ?'), 'Should guard Bedroom field to hide when not available');
  assert.ok(content.includes('{bathroomText ?'), 'Should guard Bathroom field to hide when not available');
  assert.ok(content.includes('{livingAreaText ?'), 'Should guard Living Area field to hide when not available');
  assert.equal(content.includes('(project.units || "Active MLS")'), false, 'Price/SF must not fall back to units or Active MLS');
});

test('idx-properties normalizes units, minSqft, maxSqft, and parses stories from height string', () => {
  const content = fs.readFileSync('src/lib/server/idx-properties.ts', 'utf8');
  assert.ok(content.includes('minSqft:'), 'Should normalize minSqft');
  assert.ok(content.includes('maxSqft:'), 'Should normalize maxSqft');
  assert.ok(content.includes('rawUnits = record.units'), 'Should extract units from record.units regardless of type');
  assert.ok(content.includes('heightHasStories'), 'Should detect stories in height string');
});

