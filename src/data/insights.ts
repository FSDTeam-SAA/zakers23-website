export type InsightCategory =
  | "All"
  | "Market Intelligence"
  | "Market Update"
  | "Neighborhood Intelligence"
  | "Buyer's Guide"
  | "Lifestyle Editorial";

export type InsightArticle = {
  slug: string;
  category: Exclude<InsightCategory, "All">;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  heroImage: string;
  content: string;
};

export const insightCategories: InsightCategory[] = [
  "All",
  "Market Intelligence",
  "Market Update",
  "Neighborhood Intelligence",
  "Buyer's Guide",
  "Lifestyle Editorial",
];

export const insightArticles: InsightArticle[] = [
  {
    slug: "vertical-mega-compounds-miami-preconstruction",
    category: "Market Intelligence",
    title: "The Vertical Mega-Compound: Why Miami's Elite Are Buying the Entire Floor",
    excerpt:
      "Explore why ultra-wealthy buyers are assembling contiguous floorplates in Miami's luxury pre-construction market to create highly secure vertical compounds.",
    date: "Jun 18, 2026",
    readTime: "6 min read",
    heroImage: "https://frasermiami.s3.amazonaws.com/baccarat/exterior-hummingbird-sunrise.webp",
    content: `
      <p>The definition of a trophy asset in Miami has fundamentally changed. As billionaires assemble sprawling, multi-acre monopolies on the ground, a parallel and highly strategic shift is occurring in the luxury new-development sector: the quiet absorption of contiguous floorplates to create vertical mega-compounds.</p>

      <h2>The Shift from Acreage to Altitude</h2>
      <p>Over the last four years, the market has focused heavily on the single-family assemblages occurring on Miami's barrier islands. Ultra-high-net-worth buyers have systematically purchased adjacent estates to create hyper-private compounds. However, the availability of contiguous waterfront dirt is finite, and the entry point has pushed well past the $100 million mark.</p>
      <p>As ground-level inventory vanishes, capital is seeking alternative ways to secure monumental square footage without compromising on location. This has directly driven a surge in pre-construction condominium assemblages, where buyers are translating the compound strategy from acreage to altitude.</p>

      <h2>The Motive: Absolute Privacy and the Blank Canvas</h2>
      <p>In the new development space, the ultimate luxury is no longer just the view—it is the control of the environment. Buyers at the highest end of the market are approaching sponsors early to purchase entire un-demised floors. The primary driver is not simply the need for 10,000 square feet; it is the demand for absolute privacy. By acquiring the entire floor, owners eliminate shared hallways and ensure the elevator doors open only for them.</p>
      <p>Equally important is the architectural freedom. Combining units after a building is delivered requires tearing down walls and navigating existing mechanical systems. Securing an assemblage during the pre-construction phase at a project like the <a href="/property/st-regis-brickell-residences">St. Regis Residences Brickell</a> allows the buyer to acquire a "blank canvas" shell, dictating the layout alongside the developer's architects before the concrete is poured.</p>

      <h2>The Multi-Generational Ecosystem</h2>
      <p>Beyond pure privacy, the vertical assemblage is increasingly utilized to house multi-generational wealth. Instead of managing a sprawling, maintenance-heavy estate, buyers are creating private ecosystems in the sky. We are seeing early absorption at properties like <a href="/property/cipriani-residences-brickell">Cipriani Residences Brickell</a> and <a href="/property/baccarat-residences-brickell">Baccarat Residences Brickell</a> driven by end-users locking down adjacent lines to create primary and secondary suites on the same level.</p>
      <p>This model provides aging parents, adult children, and the primary owners with shared access to institutional-grade security and branded hospitality services, while maintaining strictly delineated private quarters.</p>

      <h2>The Pre-Construction Window of Opportunity</h2>
      <p>Executing a vertical compound requires exact timing. Once a project reaches a certain construction milestone—typically when the mechanical, electrical, and plumbing (MEP) engineering is locked for a specific floor—combining units becomes exponentially more expensive and often structurally impossible.</p>
      <p>For buyers looking to establish a massive footprint in Miami, the critical window opens during the friends-and-family or reservation phase. Engaging early in developments like the <a href="/property/waldorf-astoria-residences">Waldorf Astoria Residences</a> allows you to secure priority elevator access and negotiate combination logistics directly with the sponsor.</p>

      <h2>The Premium of a 1-of-1 Asset</h2>
      <p>From an investment perspective, these custom mega-units command a significant premium upon completion. Because the inventory of seamless, 10,000+ square foot single-level condos in Miami is statistically near zero, buyers who successfully execute an early-stage vertical assemblage insulate their capital. They are creating a bespoke product class that cannot be easily replicated in the secondary market.</p>
    `,
  },
  {
    slug: "miami-preconstruction-pricing-reset",
    category: "Market Intelligence",
    title: "Where Miami Pre-Construction Pricing Is Resetting in 2026",
    excerpt:
      "A look at which submarkets are holding firm, where incentives are quietly returning, and how branded pricing is separating from the broader field.",
    date: "Aug 1, 2026",
    readTime: "6 min read",
    heroImage: "https://frasermiami.s3.amazonaws.com/baccarat/exterior-hummingbird-sunrise.webp",
    content: `
      <p>Miami's pre-construction landscape is experiencing a healthy, structural reset as we move deeper into 2026. While headlines often group the entire South Florida market together, the reality on the ground is highly segmented. Premium branded towers in core locations continue to find buyers at record price-per-square-foot levels, while secondary submarkets are seeing a quiet return of buyer incentives.</p>

      <h2>Submarket Segmentation</h2>
      <p>The Brickell, Edgewater, and Coconut Grove submarkets have shown remarkable resilience. The limited availability of prime waterfront parcels means that developers in these areas face minimal competition, allowing them to maintain firm pricing. In contrast, emerging districts are seeing slightly longer absorption timelines, prompting some sponsors to offer flexible deposit structures or interior design credits.</p>

      <h2>The Branded Premium</h2>
      <p>Branded residences continue to lead the charge. Buyers are willing to pay a substantial premium for the quality assurance and standard of service associated with global names. This flight to quality is separating the market into two clear tiers: institutional-grade branded developments, and standard unbranded construction.</p>
    `,
  },
  {
    slug: "brickell-brand-premium",
    category: "Neighborhood Intelligence",
    title: "Why Brickell Keeps Commanding a Brand Premium",
    excerpt:
      "From Cipriani to St. Regis and Baccarat, Brickell's hospitality-led towers continue to price above comparable unbranded inventory.",
    date: "Jul 28, 2026",
    readTime: "5 min read",
    heroImage: "https://frasermiami.s3.amazonaws.com/waldorf/waldorf-astoria-hero-twilight.webp",
    content: `
      <p>Brickell's evolution into a global financial center has been accompanied by a dramatic upgrade in its residential offerings. The neighborhood's skyline is no longer defined by generic glass boxes; instead, a new class of ultra-luxury branded towers is setting the benchmark for urban living in Miami.</p>

      <h2>Hospitality-Led Living</h2>
      <p>Properties like the St. Regis Residences, Cipriani Residences, and Baccarat Residences are importing world-class hospitality standards directly into the residential space. For the buyer, this means access to private dining, bespoke butler services, and highly curated amenity suites that replicate the experience of a five-star hotel.</p>

      <h2>The Investment Case for Branded Condos</h2>
      <p>Data shows that branded condos in Brickell consistently command a premium of 20% to 35% over unbranded counterparts. This premium is driven by trust, global brand recognition, and the long-term maintenance standards that institutional brands demand of their operating partners.</p>
    `,
  },
  {
    slug: "buyer-guide-offmarket-waterfront",
    category: "Buyer's Guide",
    title: "How to Approach an Off-Market Waterfront Search in Miami",
    excerpt:
      "The buyers who access the best bayfront inventory usually start earlier, narrow faster, and understand how private deal flow actually moves.",
    date: "Jul 22, 2026",
    readTime: "7 min read",
    heroImage: "https://frasermiami.s3.amazonaws.com/ariareserve/aria-reserve-exterior-day.webp",
    content: `
      <p>Finding a premium waterfront property in Miami has become increasingly challenging. The most desirable homes on the Venetian Islands, Star Island, and Indian Creek rarely make it to public listing services. For buyers seeking prime bayfront or oceanfront estates, navigating the off-market sector is a necessity.</p>

      <h2>Understanding Private Deal Flow</h2>
      <p>Off-market transactions rely heavily on relationships and discretion. Sellers at this level value privacy above all else and often request pocket listings to keep their properties out of the public eye. Accessing this inventory requires working with advisors who have established connections within private banking and luxury brokerage networks.</p>

      <h2>Key Strategies for Success</h2>
      <p>Buyers should define their parameters clearly before starting. Having your proof of funds and corporate structures ready to execute is vital, as off-market sellers expect highly professional, efficient, and seamless transactions without extended diligence periods.</p>
    `,
  },
  {
    slug: "midyear-market-update",
    category: "Market Update",
    title: "Mid-Year Update: Deliveries, Launches, and Pricing Pressure",
    excerpt:
      "What changed across Miami's luxury new development pipeline in the first half of 2026, and which launches are driving the conversation now.",
    date: "Jul 15, 2026",
    readTime: "4 min read",
    heroImage: "https://frasermiami.s3.amazonaws.com/bentley/bentley-residences-hero.jpg",
    content: `
      <p>The first half of 2026 has been one of the most active periods for Miami's luxury residential market. Several landmark projects have reached completion, while new launches continue to test the limits of price-per-square-foot records.</p>

      <h2>Construction and Deliveries</h2>
      <p>As major towers prepare to welcome residents, the focus is shifting from developer sales to secondary market absorption. We are closely monitoring the delivery of key waterfront projects to see how resales hold up against original developer pricing. Thus far, secondary demand remains highly supportive.</p>

      <h2>Looking Ahead</h2>
      <p>Developers are preparing a fresh wave of launches for the fall of 2026. The emphasis remains firmly on luxury amenities, high security, and unique lifestyle concepts designed to attract wealth from across the globe.</p>
    `,
  },
  {
    slug: "coconut-grove-boutique-supply",
    category: "Neighborhood Intelligence",
    title: "Coconut Grove's Boutique Supply Problem Is Exactly the Appeal",
    excerpt:
      "Zoning constraints, canopy protections, and true scarcity are why Grove projects keep attracting long-term primary-home buyers.",
    date: "Jul 9, 2026",
    readTime: "5 min read",
    heroImage: "https://frasermiami.s3.amazonaws.com/casabella/Casa-Bella-Living-Room.webp",
    content: `
      <p>Coconut Grove remains one of Miami's most exclusive and supply-constrained residential markets. Unlike the soaring towers of Brickell or Downtown, the Grove is defined by low-rise, boutique developments that blend seamlessly into the lush canopy.</p>

      <h2>Scarcity by Design</h2>
      <p>Zoning protections and strict environmental codes ensure that Coconut Grove preserves its unique neighborhood character. This scarcity of buildable land means that supply remains structurally constrained, keeping values high and protecting buyers from the risk of oversupply.</p>

      <h2>The Primary Homebuyer Haven</h2>
      <p>The Grove's excellent private schools, walkable village center, and private marinas make it the neighborhood of choice for domestic buyers establishing primary residences. This creates a stable, long-term community base that insulates the market from speculative swings.</p>
    `,
  },
  {
    slug: "lifestyle-editorial-skyline-living",
    category: "Lifestyle Editorial",
    title: "What Buyers Are Really Paying For in Skyline Residences",
    excerpt:
      "It's not just the view. Privacy, services, elevator ratios, and how the building lands you in the city all matter more than brochures suggest.",
    date: "Jun 30, 2026",
    readTime: "4 min read",
    heroImage: "https://frasermiami.s3.amazonaws.com/bentley/bentley-residences-lobby-interior.jpg",
    content: `
      <p>Modern luxury skyline residences are redefining what it means to live in the clouds. While marketing brochures focus heavily on panoramic water views, experienced buyers understand that true luxury lies in the details of the building's engineering and operations.</p>

      <h2>The Importance of Vertical Flow</h2>
      <p>High-speed private elevator vestibules, favorable elevator-to-unit ratios, and dedicated service corridors are crucial. A building can have beautiful finishes, but if residents face long waits for elevators or share passenger cabs with service staff, the luxury experience is compromised.</p>

      <h2>Bespoke Amenities</h2>
      <p>From private car elevators that deliver your vehicle directly to your living room to automated package handling and custom-engineered acoustic insulation, the engineering behind modern luxury towers is what truly justifies their premium pricing.</p>
    `,
  },
];
