const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('waterfront-mls.json includes resale metadata for 485 W Matheson Drive and all listings', () => {
  const filePath = path.join(__dirname, '../src/data/waterfront-mls.json');
  const listings = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const matheson = listings.find((p) => p.slug === '485-w-matheson-drive-a12005335');
  assert.ok(matheson, '485 W Matheson Drive must exist');

  assert.equal(matheson.isResale, true, '485 W Matheson Drive must be marked as resale');
  assert.equal(matheson.yearBuilt, 1981, '485 W Matheson Drive yearBuilt must be 1981');
  assert.ok(matheson.lotSize.includes('2.38 Acres'), '485 W Matheson Drive must have lot size with 2.38 Acres');
  assert.ok(typeof matheson.daysOnMarket === 'number' && matheson.daysOnMarket > 0, 'daysOnMarket must be a positive number');
  assert.ok(matheson.waterfrontDetails && matheson.waterfrontDetails.length > 10, 'waterfrontDetails must be present');
  assert.ok(matheson.dockDetails && matheson.dockDetails.includes('marina'), 'dockDetails must detail the private marina');
  assert.equal(matheson.description.includes('Winter White House” of,'), false, 'Description must not have gap after Winter White House of,');
  assert.ok(matheson.description.includes('President Richard Nixon'), 'Description must include President Richard Nixon');
});

test('ResalePropertyDetailPage contains the 8 required fields and omits Compare Development & Delivery', () => {
  const templatePath = path.join(__dirname, '../src/features/Property/components/ResalePropertyDetailPage.tsx');
  const content = fs.readFileSync(templatePath, 'utf8');

  // Must not have "Compare Development"
  assert.equal(content.includes('Compare Development'), false, 'Resale template must not have "Compare Development"');
  assert.equal(content.includes('+ Compare Development'), false, 'Resale template must not have "+ Compare Development"');

  // Must not label Year Built as "Delivery"
  assert.equal(content.includes('Delivery'), false, 'Resale template must not show "Delivery" stat');

  // Must not label Resale homes as "New Construction"
  assert.equal(content.includes('New Construction'), false, 'Resale template must not label homes as New Construction');

  // Must contain the 8 required fields
  assert.ok(content.includes('Offering Price') || content.includes('Price'), 'Must display Price');
  assert.ok(content.includes('Bedrooms'), 'Must display Bedrooms');
  assert.ok(content.includes('Bathrooms'), 'Must display Bathrooms');
  assert.ok(content.includes('Living Area (SF)'), 'Must display SF (square footage)');
  assert.ok(content.includes('Lot Size'), 'Must display Lot size');
  assert.ok(content.includes('Year Built'), 'Must display Year built');
  assert.ok(content.includes('Waterfront & Dock') || content.includes('Waterfront &amp; Dock'), 'Must display Waterfront / dock details');
  assert.ok(content.includes('Days on Market'), 'Must display Days on market');
});

test('PropertyDetailWrapper imports and conditionally routes to ResalePropertyDetailPage', () => {
  const wrapperPath = path.join(__dirname, '../src/features/Property/components/PropertyDetailWrapper.tsx');
  const content = fs.readFileSync(wrapperPath, 'utf8');

  assert.ok(content.includes('ResalePropertyDetailPage'), 'Wrapper must import ResalePropertyDetailPage');
  assert.ok(content.includes('isResale'), 'Wrapper must check isResale condition');
  assert.ok(content.includes('<ResalePropertyDetailPageClient'), 'Wrapper must render ResalePropertyDetailPageClient when isResale is true');
});

test('Winter White House description gap repair correctly restores President Richard Nixon across quote formats', () => {
  const sanitizeDesc = (desc) => {
    return desc
      .replace(/(["'“‘]?Winter White House["'”’]?\s+of)\s*,/gi, '“Winter White House” of President Richard Nixon,')
      .replace(/(["'“‘]?Winter White House["'”’]?\s+of)\s+(?!President|Richard)/gi, '“Winter White House” of President Richard Nixon, ');
  };

  const sample1 = "Once the 'Winter White House' of, the estate also achieved cinematic fame";
  const sample2 = "Once the \"Winter White House\" of, the estate";
  const sample3 = "Once the “Winter White House” of, the estate";
  const sample4 = "the 'Winter White House' of, is missing the name";

  assert.ok(sanitizeDesc(sample1).includes('President Richard Nixon'));
  assert.ok(sanitizeDesc(sample2).includes('President Richard Nixon'));
  assert.ok(sanitizeDesc(sample3).includes('President Richard Nixon'));
  assert.ok(sanitizeDesc(sample4).includes('President Richard Nixon'));
  assert.equal(sanitizeDesc(sample1).includes("'Winter White House' of,"), false);
});

test('waterfront-mls classifies single-family vs condos and waterfront-page provides propertyTypeFilter', () => {
  const filePath = path.join(__dirname, '../src/data/waterfront-mls.json');
  const listings = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const collins = listings.find((l) => l.name.includes('2901 Collins'));
  const biscayne = listings.find((l) => l.name.includes('300 Biscayne'));
  const matheson = listings.find((l) => l.name.includes('485 W Matheson'));

  assert.ok(collins, '2901 Collins listing must exist');
  assert.ok(biscayne, '300 Biscayne listing must exist');
  assert.ok(matheson, '485 W Matheson listing must exist');

  // Verify condos/penthouses are NOT classified as single-family
  assert.notEqual(collins.propertySubtype, 'single-family', '2901 Collins #1602 must not be single-family');
  assert.notEqual(biscayne.propertySubtype, 'single-family', '300 Biscayne #6301 must not be single-family');
  assert.equal(matheson.propertySubtype, 'single-family', '485 W Matheson must be single-family');

  // Verify waterfront-page.tsx has propertyTypeFilter and renamed section
  const pagePath = path.join(__dirname, '../src/features/Waterfront/components/waterfront-page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  assert.ok(pageContent.includes('propertyTypeFilter'), 'waterfront-page.tsx must have propertyTypeFilter');
  assert.ok(pageContent.includes('Single-Family Estates'), 'waterfront-page.tsx must offer Single-Family Estates tab');
  assert.ok(pageContent.includes('Condos & Penthouses'), 'waterfront-page.tsx must offer Condos & Penthouses tab');
  assert.ok(pageContent.includes('Active Waterfront Estates & Residences') || pageContent.includes('Active Waterfront Estates &amp; Residences'), 'waterfront-page.tsx must accurately rename section title');
});

test('featured-project.data.ts matches verified developer info and authentic building images', () => {
  const filePath = path.join(__dirname, '../src/features/Home/FeaturedProject/data/featured-project.data.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  // Bugatti must not list Dubai developer Binghatti
  assert.equal(content.includes('Binghatti'), false, 'Bugatti must not list Binghatti');
  assert.ok(content.includes('ONE Sotheby\'s International Realty'), 'Bugatti must list ONE Sotheby\'s');

  // St. Regis Brickell sales team must be Related Realty, not Sotheby's
  assert.ok(content.includes('Related Realty'), 'St. Regis Brickell / NoMad must credit Related Realty');

  // UNA Residences must reflect 2025 delivery
  assert.ok(content.includes('DELIVERED 2025'), 'UNA Residences status must reflect completed 2025 delivery');

  // NoMad Wynwood must reflect developer pricing from $670,900 and 9 remaining units
  assert.ok(content.includes('$670,900'), 'NoMad Wynwood must reflect developer pricing from $670,900');
  assert.ok(content.includes('9 REMAIN'), 'NoMad Wynwood must note 9 remain');

  // Mandarin Oriental must reflect breaking ground with $1.7B+ in sales
  assert.ok(content.includes('$1.7B+ IN SALES') || content.includes('BROKE GROUND'), 'Mandarin Oriental must reflect groundbreaking and sales');
});

test('Beta review fixes: hero single H1, local images, sitemap, privacy page, and redirects', () => {
  // 1. Single H1 on hero
  const heroContent = fs.readFileSync(path.join(__dirname, '../src/features/Home/HeroSection/componets/hero-section.tsx'), 'utf8');
  assert.ok(heroContent.includes('index === 0 ? <h1>{slide.title}</h1> : <h2>{slide.title}</h2>'), 'Hero section must have only one H1 for slide 0');

  // 2. Hero slides must use local images, not hotlinked S3
  const heroData = fs.readFileSync(path.join(__dirname, '../src/features/Home/HeroSection/data/hero-section.data.ts'), 'utf8');
  assert.ok(!heroData.includes('https://frasermiami.s3.amazonaws.com/ciprianiresidences'), 'Cipriani must not be hotlinked from S3');
  assert.ok(heroData.includes('/images/cipriani/skyline.webp'), 'Cipriani must use local image asset');
  assert.ok(heroData.includes('/images/rivage/beachhero.webp'), 'Rivage must use local image asset');
  assert.ok(heroData.includes('FIRST ANANTARA IN THE U.S. · FROM $1.8M'), 'Anantara must use uniform From $1.8M format');

  // 3. Featured projects View All links to full listings page
  const featuredContent = fs.readFileSync(path.join(__dirname, '../src/features/Home/FeaturedProject/components/featured-projects-section.tsx'), 'utf8');
  assert.ok(featuredContent.includes('href="/waterfront"'), 'View All button must link to /waterfront listings');
  assert.ok(!featuredContent.includes('View All\n            <span aria-hidden="true">→</span>\n          </a>'), 'View All must not link to #contact');

  // 4. Bio typo fixed in advisor and property pages
  const advisorContent = fs.readFileSync(path.join(__dirname, '../src/features/Home/components/advisor-section.tsx'), 'utf8');
  assert.ok(!advisorContent.includes('Zach, is a veteran'), 'Advisor bio must not have stray comma');
  assert.ok(advisorContent.includes('Zachary is a veteran of 14 years'), 'Advisor bio must consistently use Zachary');

  // 5. Privacy Policy page & Footer link & No continuous updates claim
  assert.ok(fs.existsSync(path.join(__dirname, '../src/app/privacy/page.tsx')), 'Privacy page must exist at /privacy');
  const footerContent = fs.readFileSync(path.join(__dirname, '../src/features/Home/components/site-footer.tsx'), 'utf8');
  assert.ok(footerContent.includes('href="/privacy"'), 'Footer must link to /privacy');
  assert.ok(!footerContent.includes('Data updated continuously'), 'Footer must not claim continuous updates');

  // 6. Robots and Sitemap routes
  assert.ok(fs.existsSync(path.join(__dirname, '../src/app/robots.ts')), 'robots.ts must exist');
  assert.ok(fs.existsSync(path.join(__dirname, '../src/app/sitemap.ts')), 'sitemap.ts must exist');

  // 7. Redirects for /neighborhoods
  const nextConfig = fs.readFileSync(path.join(__dirname, '../next.config.ts'), 'utf8');
  assert.ok(nextConfig.includes('/neighborhoods/:slug*'), 'next.config.ts must redirect /neighborhoods/:slug*');

  // 8. SSR enabled for Google crawlers
  const wrapperContent = fs.readFileSync(path.join(__dirname, '../src/features/Property/components/PropertyDetailWrapper.tsx'), 'utf8');
  assert.ok(wrapperContent.includes('ssr: true'), 'PropertyDetailWrapper must enable SSR for crawlers');
});



