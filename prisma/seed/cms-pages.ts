import { PrismaClient } from "@prisma/client";

export async function seedCmsPages(prisma: PrismaClient) {
  console.log("  📄 Creating CMS pages...");

  // Get location type setting
  const locationTypeSetting = await prisma.siteSettings.findUnique({
    where: { key: "app.locationType" },
  });
  const LOCATION_TYPE = locationTypeSetting?.value || "MULTI";

  // About Page
  const aboutPage = await prisma.page.upsert({
    where: { slug: "about" },
    update: {},
    create: {
      slug: "about",
      title: "About Us",
      type: "ABOUT",
      heroImage: null,
      content: "",
      metaDescription:
        "Learn about our specialty coffee roastery, our values, and our commitment to quality.",
      showInFooter: true,
      footerOrder: 1,
      isPublished: true,
      publishedAt: new Date(),
      generatedBy: "manual",
    },
  });

  // Clear existing blocks
  await prisma.block.deleteMany({ where: { pageId: aboutPage.id } });

  // About page blocks
  await prisma.block.create({
    data: {
      pageId: aboutPage.id,
      type: "hero",
      order: 0,
      isDeleted: false,
      content: {
        heading: "Our Story",
        imageUrl: "https://placehold.co/1920x800/8B4513/FFF?text=Our+Story",
        imageAlt: "Artisan Roast coffee roastery",
        caption: "Crafting exceptional coffee experiences since 2015",
      },
    },
  });

  const aboutStats = [
    { emoji: "☕", value: "10,000+", label: "Cups Served Daily" },
    { emoji: "🌍", value: "12", label: "Origin Countries" },
    { emoji: "⭐", value: "4.9", label: "Customer Rating" },
  ];

  for (let i = 0; i < aboutStats.length; i++) {
    await prisma.block.create({
      data: {
        pageId: aboutPage.id,
        type: "stat",
        order: i + 1,
        isDeleted: false,
        content: aboutStats[i],
      },
    });
  }

  await prisma.block.create({
    data: {
      pageId: aboutPage.id,
      type: "pullQuote",
      order: 4,
      isDeleted: false,
      content: {
        text: "Every cup tells a story — from the hands that picked the cherries to the moment it reaches yours.",
        author: "Our Founding Philosophy",
      },
    },
  });

  await prisma.block.create({
    data: {
      pageId: aboutPage.id,
      type: "richText",
      order: 5,
      isDeleted: false,
      content: {
        html: `
          <h2>Our Journey</h2>
          <p>What started as a small passion project in a garage has grown into a beloved specialty coffee roastery. We source our beans directly from farmers across 12 countries, ensuring fair trade practices and exceptional quality at every step.</p>

          <h3>Our Commitment</h3>
          <p>Quality, sustainability, and community are at the heart of everything we do. We roast in small batches to bring out the unique flavor profiles of each origin, and we're proud to support the farmers and communities who make our coffee possible.</p>

          <h3>Visit Us</h3>
          <p>Stop by our roastery to experience the art of coffee roasting firsthand. Our team is always happy to share a cup and talk about what makes specialty coffee special.</p>
        `,
      },
    },
  });

  console.log("    ✓ About page with blocks");

  // Café Page
  const cafePage = await prisma.page.upsert({
    where: { slug: "cafe" },
    update: {},
    create: {
      slug: "cafe",
      title: LOCATION_TYPE === "SINGLE" ? "Visit Our Café" : "Visit Our Cafés",
      type: "CAFE",
      heroImage: null,
      content: "",
      metaDescription:
        LOCATION_TYPE === "SINGLE"
          ? "Visit our café for freshly roasted specialty coffee. Find our location, hours, and what to expect."
          : "Visit our café locations for freshly roasted specialty coffee. Find our locations, hours, and what to expect.",
      showInFooter: true,
      footerOrder: 3,
      isPublished: true,
      publishedAt: new Date(),
      generatedBy: "manual",
    },
  });

  // Clear existing blocks
  await prisma.block.deleteMany({ where: { pageId: cafePage.id } });

  if (LOCATION_TYPE === "SINGLE") {
    // Single location setup
    await prisma.block.create({
      data: {
        pageId: cafePage.id,
        type: "imageCarousel",
        order: 0,
        isDeleted: false,
        content: {
          slides: [
            {
              url: "https://placehold.co/800x600/8B4513/FFF?text=Cozy+Interior",
              alt: "Cozy interior seating",
            },
            {
              url: "https://placehold.co/800x600/654321/FFF?text=Espresso+Bar",
              alt: "Espresso bar",
            },
            {
              url: "https://placehold.co/800x600/A0522D/FFF?text=Outdoor+Patio",
              alt: "Outdoor patio",
            },
            {
              url: "https://placehold.co/800x600/8B4513/FFF?text=Brewing+Station",
              alt: "Brewing station",
            },
            {
              url: "https://placehold.co/800x600/654321/FFF?text=Lounge+Area",
              alt: "Lounge area",
            },
          ],
          autoScroll: true,
          intervalSeconds: 5,
        },
      },
    });

    await prisma.block.create({
      data: {
        pageId: cafePage.id,
        type: "location",
        order: 1,
        isDeleted: false,
        content: {
          name: "Artisan Roast Café",
          address: "427 MARKET STREET\nSAN FRANCISCO, CA 94105",
          phone: "(415) 555-0142",
          googleMapsUrl:
            "https://maps.google.com/?q=427+Market+St+San+Francisco+CA+94105",
          description:
            "Welcome to our specialty coffee café in the heart of downtown...",
          schedule: [
            { day: "Monday - Friday", hours: "6:30AM - 7PM" },
            { day: "Saturday - Sunday", hours: "7AM - 6PM" },
          ],
          images: [
            {
              url: "https://placehold.co/600x400/8B4513/FFF?text=Cafe+Exterior",
              alt: "Café exterior",
            },
            {
              url: "https://placehold.co/600x400/654321/FFF?text=Interior+Seating",
              alt: "Interior seating",
            },
            {
              url: "https://placehold.co/600x400/A0522D/FFF?text=Espresso+Bar",
              alt: "Espresso bar",
            },
          ],
        },
      },
    });

    console.log("    ✓ Café page (single location)");
  } else {
    // Multi-location setup
    const carouselBlock = await prisma.block.create({
      data: {
        pageId: cafePage.id,
        type: "locationCarousel",
        order: 0,
        isDeleted: false,
        content: {
          slides: [
            {
              url: "https://placehold.co/800x600/654321/FFF?text=Market+Street",
              alt: "Market Street location",
              title: "Market Street",
              description: "Our flagship location",
              locationBlockId: "temp-1",
            },
            {
              url: "https://placehold.co/800x600/8B4513/FFF?text=Pearl+Street",
              alt: "Pearl Street location",
              title: "Pearl Street",
              description: "Cozy neighborhood spot",
              locationBlockId: "temp-2",
            },
            {
              url: "https://placehold.co/800x600/A0522D/FFF?text=Hawthorne+Blvd",
              alt: "Hawthorne Boulevard cafe",
              title: "Hawthorne Boulevard",
              description: "Relaxed atmosphere",
              locationBlockId: "temp-3",
            },
          ],
          autoScroll: true,
          intervalSeconds: 5,
        },
      },
    });

    // Create location blocks
    const locations = [
      {
        name: "Market Street",
        address: "427 MARKET STREET\nSAN FRANCISCO, CA 94105",
        phone: "(415) 555-0142",
        mapsUrl:
          "https://maps.google.com/?q=427+Market+St+San+Francisco+CA+94105",
        description: "Our flagship location in the heart of downtown...",
        schedule: [
          { day: "Monday - Friday", hours: "6:30AM - 7PM" },
          { day: "Saturday - Sunday", hours: "7AM - 6PM" },
        ],
        images: [
          {
            url: "https://placehold.co/600x400/654321/FFF?text=Market+St+Exterior",
            alt: "Market Street exterior",
          },
          {
            url: "https://placehold.co/600x400/8B4513/FFF?text=Market+St+Interior",
            alt: "Interior seating",
          },
          {
            url: "https://placehold.co/600x400/A0522D/FFF?text=Market+St+Bar",
            alt: "Espresso bar",
          },
        ],
      },
      {
        name: "Pearl Street",
        address: "1523 PEARL STREET\nBOULDER, CO 80302",
        phone: "(303) 555-0198",
        mapsUrl: "https://maps.google.com/?q=1523+Pearl+St+Boulder+CO+80302",
        description:
          "Cozy neighborhood café known for our house-baked pastries...",
        schedule: [
          { day: "Monday - Friday", hours: "6AM - 6PM" },
          { day: "Saturday - Sunday", hours: "7AM - 5PM" },
        ],
        images: [
          {
            url: "https://placehold.co/600x400/8B4513/FFF?text=Pearl+St+Storefront",
            alt: "Pearl Street storefront",
          },
          {
            url: "https://placehold.co/600x400/654321/FFF?text=Pearl+St+Pastries",
            alt: "Pastry display",
          },
          {
            url: "https://placehold.co/600x400/A0522D/FFF?text=Pearl+St+Patio",
            alt: "Outdoor patio",
          },
        ],
      },
      {
        name: "Hawthorne Boulevard",
        address: "812 SE HAWTHORNE BLVD\nPORTLAND, OR 97214",
        phone: "(503) 555-0276",
        mapsUrl:
          "https://maps.google.com/?q=812+SE+Hawthorne+Blvd+Portland+OR+97214",
        description:
          "Relaxed atmosphere perfect for studying, working, or meeting friends...",
        schedule: [
          { day: "Monday - Thursday", hours: "7AM - 8PM" },
          { day: "Friday", hours: "7AM - 10PM" },
          { day: "Saturday - Sunday", hours: "8AM - 8PM" },
        ],
        images: [
          {
            url: "https://placehold.co/600x400/A0522D/FFF?text=Hawthorne+Entrance",
            alt: "Hawthorne Boulevard entrance",
          },
          {
            url: "https://placehold.co/600x400/8B4513/FFF?text=Hawthorne+Seating",
            alt: "Comfortable seating",
          },
          {
            url: "https://placehold.co/600x400/654321/FFF?text=Hawthorne+Bar",
            alt: "Coffee and tea bar",
          },
        ],
      },
    ];

    const locationBlocks = [];
    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];
      const block = await prisma.block.create({
        data: {
          pageId: cafePage.id,
          type: "location",
          order: i + 1,
          isDeleted: false,
          content: {
            name: location.name,
            address: location.address,
            phone: location.phone,
            googleMapsUrl: location.mapsUrl,
            description: location.description,
            schedule: location.schedule,
            images: location.images,
          },
        },
      });
      locationBlocks.push(block);
    }

    // Update carousel with actual block IDs
    await prisma.block.update({
      where: { id: carouselBlock.id },
      data: {
        content: {
          slides: locationBlocks.map((block, index) => ({
            url: locations[index].images[0].url,
            alt: locations[index].images[0].alt,
            title: locations[index].name,
            description: locations[index].description.split(".")[0] + ".",
            locationBlockId: block.id,
          })),
          autoScroll: true,
          intervalSeconds: 5,
        },
      },
    });

    console.log("    ✓ Café page (multi-location)");
  }

  // FAQ Page
  const faqPage = await prisma.page.upsert({
    where: { slug: "faq" },
    update: {},
    create: {
      slug: "faq",
      title: "Frequently Asked Questions",
      type: "FAQ",
      heroImage: null,
      content: "",
      metaDescription:
        "Find answers to common questions about our coffee, orders, shipping, returns, and more.",
      showInFooter: true,
      footerOrder: 4,
      isPublished: true,
      publishedAt: new Date(),
      generatedBy: "manual",
    },
  });

  // Clear existing blocks
  await prisma.block.deleteMany({ where: { pageId: faqPage.id } });

  // FAQ hero
  await prisma.block.create({
    data: {
      pageId: faqPage.id,
      type: "hero",
      order: 0,
      isDeleted: false,
      content: {
        heading: "Frequently Asked Questions",
        imageUrl: "https://placehold.co/1920x800/654321/FFF?text=FAQ",
        imageAlt: "Coffee beans background",
        caption:
          "Find answers to common questions about our coffee, orders, shipping, and more.",
      },
    },
  });

  // FAQ items
  const faqItems = [
    {
      category: "general",
      question: "What makes your coffee special?",
      answer:
        "We source our beans directly from small-batch farmers around the world...",
    },
    {
      category: "general",
      question: "Do you offer coffee subscriptions?",
      answer: "Yes! We offer flexible subscription plans...",
    },
    {
      category: "orders",
      question: "How do I place an order?",
      answer: "Simply browse our products, add items to your cart...",
    },
    {
      category: "shipping",
      question: "How long does shipping take?",
      answer: "Standard shipping typically takes 3-5 business days...",
    },
    {
      category: "products",
      question: "How should I store my coffee?",
      answer: "Store your coffee in a cool, dark place...",
    },
  ];

  for (let i = 0; i < faqItems.length; i++) {
    await prisma.block.create({
      data: {
        pageId: faqPage.id,
        type: "faqItem",
        order: i + 1,
        isDeleted: false,
        content: faqItems[i],
      },
    });
  }

  console.log(`    ✓ FAQ page with ${faqItems.length} FAQ items`);
  console.log("  ✅ CMS pages created");
}
