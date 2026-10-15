const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("waterfront-mls.json contains unique images for distinct properties", () => {
  const filePath = path.join(__dirname, "../src/data/waterfront-mls.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const listings = JSON.parse(raw);

  assert.ok(listings.length > 50, "Should have a comprehensive collection of waterfront listings");

  const images = listings.map((l) => l.img).filter(Boolean);
  const uniqueImages = new Set(images);

  // Assert that images are diverse across listings and not collapsed into a single repetitive placeholder
  assert.ok(
    uniqueImages.size >= listings.length * 0.9,
    `Expected at least 90% unique images across waterfront listings, got ${uniqueImages.size}/${listings.length}`
  );

  // Specifically check the listings mentioned in the user report
  const fisher = listings.find((l) => l.name.includes("1007 Fisher Island"));
  const ocean = listings.find((l) => l.name.includes("7300 Ocean Terrace"));
  const palm = listings.find((l) => l.name.includes("30 Palm Avenue"));

  assert.ok(fisher && ocean && palm, "Target waterfront listings must exist in dataset");
  assert.notEqual(fisher.img, ocean.img, "Fisher Island and Ocean Terrace must have different images");
  assert.notEqual(ocean.img, palm.img, "Ocean Terrace and Palm Avenue must have different images");
  assert.notEqual(fisher.img, palm.img, "Fisher Island and Palm Avenue must have different images");
});

test("waterfront-page.tsx provides property-specific fallbacks and error handling", () => {
  const filePath = path.join(__dirname, "../src/features/Waterfront/components/waterfront-page.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  assert.ok(
    content.includes("itemFallback"),
    "waterfront-page.tsx must compute a property-specific itemFallback"
  );
  assert.ok(
    content.includes("data-fallback={itemFallback}"),
    "waterfront-page.tsx must pass data-fallback attribute to listing Image"
  );
  assert.ok(
    content.includes("onError="),
    "waterfront-page.tsx must handle onError on listing Image to swap to fallback"
  );
});

test("ImageFallbackProvider supports data-fallback and diversified luxury fallback resolution", () => {
  const filePath = path.join(__dirname, "../src/components/ImageFallbackProvider.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  assert.ok(
    content.includes("customFallback") || content.includes("dataset.fallback"),
    "ImageFallbackProvider must check for dataset.fallback on failing images"
  );
  assert.ok(
    content.includes("getDistinctFallback"),
    "ImageFallbackProvider must use getDistinctFallback rather than a single static image"
  );
});
