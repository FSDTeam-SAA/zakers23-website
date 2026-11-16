const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('InquiryProvider exposes isSubmitted state and manages has_submitted_registration_modal key', () => {
  const content = fs.readFileSync('src/features/inquiry/components/inquiry-provider.tsx', 'utf8');
  assert.ok(content.includes('isSubmitted: boolean'), 'InquiryContextValue must expose isSubmitted');
  assert.ok(content.includes('has_submitted_registration_modal'), 'InquiryProvider must track has_submitted_registration_modal');
  assert.ok(content.includes('localStorage.setItem(SUBMITTED_KEY, "true")'), 'InquiryProvider must save submitted state to localStorage');
});

test('PropertyDetailWrapper automatically opens InquiryModal with project details when not submitted', () => {
  const content = fs.readFileSync('src/features/Property/components/PropertyDetailWrapper.tsx', 'utf8');
  assert.ok(content.includes('useInquiry'), 'PropertyDetailWrapper must use inquiry hook');
  assert.ok(content.includes('has_submitted_registration_modal'), 'PropertyDetailWrapper must check has_submitted_registration_modal');
  assert.ok(content.includes('openInquiry'), 'PropertyDetailWrapper must call openInquiry');
  assert.ok(content.includes('requireForDetails: true'), 'PropertyDetailWrapper must set requireForDetails: true');
  assert.ok(content.includes('buttonClicked: "View Details"'), 'PropertyDetailWrapper must send buttonClicked as View Details');
  assert.ok(content.includes('if (alreadySubmitted) return;'), 'PropertyDetailWrapper must skip opening modal if already submitted');
});

test('InquiryModal supports requireForDetails and records submission', () => {
  const content = fs.readFileSync('src/features/inquiry/components/inquiry-modal.tsx', 'utf8');
  assert.ok(content.includes('requireForDetails'), 'InquiryModal must accept requireForDetails prop');
  assert.ok(content.includes('has_submitted_registration_modal'), 'InquiryModal must persist submission in localStorage');
  assert.ok(content.includes('submitInquiry'), 'InquiryModal must submit inquiry with project details');
});

