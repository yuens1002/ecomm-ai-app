import { PrismaClient } from "@prisma/client";
import {
  getPlaceholderImage,
  getPlaceholderBanner,
} from "../../lib/placeholder-images";

export async function seedAboutPage(prisma: PrismaClient) {
  const aboutPage = await prisma.page.upsert({
    where: { slug: "about" },
    update: {
      title: "About",
      heroImage: "/logo.svg",
      content:
        "\n        <h2>Our Story</h2>\n        <p>Welcome to our specialty coffee roastery. This page will be customized with your unique brand story using our AI-powered wizard.</p>\n        \n        <h2>Our Values</h2>\n        <p>Quality, sustainability, and community are at the heart of everything we do.</p>\n        \n        <h2>Visit Us</h2>\n        <p>Stop by our roastery to experience the art of coffee roasting firsthand.</p>\n      ",
      showInFooter: true,
      footerOrder: 3,
      showInHeader: true,
      headerOrder: 3,
      metaDescription:
        "Learn about our specialty coffee roastery, our values, and our commitment to quality.",
      icon: "Newspaper",
    },
    create: {
      slug: "about",
      title: "About",
      type: "ABOUT",
      heroImage: "/logo.svg",
      content:
        "\n        <h2>Our Story</h2>\n        <p>Welcome to our specialty coffee roastery. This page will be customized with your unique brand story using our AI-powered wizard.</p>\n        \n        <h2>Our Values</h2>\n        <p>Quality, sustainability, and community are at the heart of everything we do.</p>\n        \n        <h2>Visit Us</h2>\n        <p>Stop by our roastery to experience the art of coffee roasting firsthand.</p>\n      ",
      metaDescription:
        "Learn about our specialty coffee roastery, our values, and our commitment to quality.",
      showInFooter: true,
      footerOrder: 3,
      showInHeader: true,
      headerOrder: 3,
      isPublished: true,
      publishedAt: new Date(),
      generatedBy: "manual",
      icon: "Newspaper",
    },
  });

  await prisma.block.deleteMany({ where: { pageId: aboutPage.id } });

  await prisma.block.create({
    data: {
      pageId: aboutPage.id,
      type: "hero",
      order: 0,
      isDeleted: false,
      content: {
        heading: "Our Story",
        imageUrl: getPlaceholderBanner("about-hero"),
        imageAlt: "Artisan Roast coffee roastery",
        caption: "Crafting exceptional coffee experiences since 2015",
      },
    },
  });

  const aboutStats = [
    { emoji: "☕", value: "250+", label: "Cups Served Daily" },
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
}

export async function seedCafePage(
  prisma: PrismaClient,
  LOCATION_TYPE: string
) {
  const cafeTitle = LOCATION_TYPE === "SINGLE" ? "Visit Our Café" : "Café";
  const cafePage = await prisma.page.upsert({
    where: { slug: "cafe" },
    update: {
      title: cafeTitle,
      content: "",
      metaDescription:
        "Visit our café for freshly roasted specialty coffee. Find our location, hours, and what to expect.",
      showInFooter: true,
      footerOrder: 1,
      showInHeader: true,
      headerOrder: 1,
      icon: "Coffee",
    },
    create: {
      slug: "cafe",
      title: cafeTitle,
      type: "CAFE",
      heroImage: null,
      content: "",
      metaDescription:
        "Visit our café for freshly roasted specialty coffee. Find our location, hours, and what to expect.",
      showInFooter: true,
      footerOrder: 1,
      showInHeader: true,
      headerOrder: 1,
      isPublished: true,
      publishedAt: new Date(),
      generatedBy: "manual",
      icon: "Coffee",
    },
  });

  await prisma.block.deleteMany({ where: { pageId: cafePage.id } });

  if (LOCATION_TYPE === "SINGLE") {
    await prisma.block.create({
      data: {
        pageId: cafePage.id,
        type: "imageCarousel",
        order: 0,
        isDeleted: false,
        content: {
          slides: [
            {
              url: getPlaceholderImage("cozy-interior", 800, "cafe"),
              alt: "Cozy interior seating",
            },
            {
              url: getPlaceholderImage("espresso-bar", 800, "cafe"),
              alt: "Espresso bar",
            },
            {
              url: getPlaceholderImage("outdoor-patio", 800, "cafe"),
              alt: "Outdoor patio",
            },
            {
              url: getPlaceholderImage("brewing-station", 800, "cafe"),
              alt: "Brewing station",
            },
            {
              url: getPlaceholderImage("lounge-area", 800, "cafe"),
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
            "Discover where the magic happens at our Market Street Roastery. With an on-site roaster and expert baristas, we serve the freshest coffee in the city. Relax in our spacious café and let the scent of freshly roasted beans awaken your senses.",
          schedule: [
            { day: "Monday - Friday", hours: "6:30AM - 7PM" },
            { day: "Saturday - Sunday", hours: "7AM - 6PM" },
          ],
          images: [
            {
              url: getPlaceholderImage("cafe-exterior", 600, "cafe"),
              alt: "Café exterior",
            },
            {
              url: getPlaceholderImage("interior-seating", 600, "cafe"),
              alt: "Interior seating",
            },
            {
              url: getPlaceholderImage("espresso-bar-detail", 600, "cafe"),
              alt: "Espresso bar",
            },
          ],
        },
      },
    });

    console.log("    ✓ Café page (single location)");
    return;
  }

  const carouselBlock = await prisma.block.create({
    data: {
      pageId: cafePage.id,
      type: "locationCarousel",
      order: 0,
      isDeleted: false,
      content: {
        slides: [
          {
            url: getPlaceholderImage("market-street", 800, "cafe"),
            alt: "Market Street location",
            title: "Market Street",
            description:
              "427 MARKET STREET\nSAN FRANCISCO, CA 94105\n\nExperience the energy of our vibrant downtown flagship, offering rare single-origin coffees in a sleek, modern setting.",
            locationBlockId: "temp-1",
          },
          {
            url: getPlaceholderImage("pearl-street", 800, "cafe"),
            alt: "Pearl Street location",
            title: "Pearl Street",
            description:
              "1523 PEARL STREET\nBOULDER, CO 80302\n\nEnjoy a cozy retreat on historic Pearl Street, known for its welcoming atmosphere and delicious house-baked pastries.",
            locationBlockId: "temp-2",
          },
          {
            url: getPlaceholderImage("hawthorne-blvd", 800, "cafe"),
            alt: "Hawthorne Boulevard cafe",
            title: "Hawthorne Boulevard",
            description:
              "812 SE HAWTHORNE BLVD\nPORTLAND, OR 97214\n\nSettle into our spacious Hawthorne hub, a relaxed creative haven designed for students, remote workers, and friends.",
            locationBlockId: "temp-3",
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
      type: "richText",
      order: 1,
      isDeleted: false,
      content: {
        html: `
          <h2>What to Expect</h2>
          <p>All of our locations feature freshly roasted beans from our local roastery, expert baristas, and a welcoming atmosphere. Whether you're grabbing a quick espresso or settling in for the afternoon, we're here to fuel your day with exceptional coffee.</p>

          <h2>Ordering &amp; Amenities</h2>
          <ul>
            <li>Order at the counter or use our mobile app for pickup</li>
            <li>Free WiFi at all locations</li>
            <li>Oat, almond, and whole milk alternatives available</li>
            <li>Loyalty rewards program – earn free drinks</li>
            <li>Private event space available (Downtown location only)</li>
          </ul>
        `,
      },
    },
  });

  const locations = [
    {
      name: "Market Street",
      address: "427 MARKET STREET\nSAN FRANCISCO, CA 94105",
      phone: "(415) 555-0142",
      mapsUrl:
        "https://maps.google.com/?q=427+Market+St+San+Francisco+CA+94105",
      description:
        "Step into the energy of downtown San Francisco at our flagship Market Street location. This vibrant hub is designed for the urban professional, offering a sleek modern aesthetic and our complete selection of rare, single-origin coffees to fuel your busy day.",
      schedule: [
        { day: "Monday - Friday", hours: "6:30AM - 7PM" },
        { day: "Saturday - Sunday", hours: "7AM - 6PM" },
      ],
      images: [
        {
          url: getPlaceholderImage("market-exterior", 600, "cafe"),
          alt: "Market Street exterior",
        },
        {
          url: getPlaceholderImage("market-interior", 600, "cafe"),
          alt: "Interior seating",
        },
        {
          url: getPlaceholderImage("market-bar", 600, "cafe"),
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
        "Discover a cozy retreat on Boulder's historic Pearl Street. Known for our delicious house-baked pastries and welcoming neighborhood vibe, this café is the perfect place to warm up. Enjoy a handcrafted latte on our patio or relax inside with friends.",
      schedule: [
        { day: "Monday - Friday", hours: "6AM - 6PM" },
        { day: "Saturday - Sunday", hours: "7AM - 5PM" },
      ],
      images: [
        {
          url: getPlaceholderImage("pearl-storefront", 600, "cafe"),
          alt: "Pearl Street storefront",
        },
        {
          url: getPlaceholderImage("pearl-pastries", 600, "cafe"),
          alt: "Pastry display",
        },
        {
          url: getPlaceholderImage("pearl-patio", 600, "cafe"),
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
        "Immerse yourself in Portland's creative spirit at our Hawthorne Boulevard café. With spacious seating and a relaxed atmosphere, it is the ultimate destination for students and remote workers. Settle in for a productive afternoon or a casual meetup in this community hub.",
      schedule: [
        { day: "Monday - Thursday", hours: "7AM - 8PM" },
        { day: "Friday", hours: "7AM - 10PM" },
        { day: "Saturday - Sunday", hours: "8AM - 8PM" },
      ],
      images: [
        {
          url: getPlaceholderImage("hawthorne-entrance", 600, "cafe"),
          alt: "Hawthorne Boulevard entrance",
        },
        {
          url: getPlaceholderImage("hawthorne-seating", 600, "cafe"),
          alt: "Comfortable seating",
        },
        {
          url: getPlaceholderImage("hawthorne-bar", 600, "cafe"),
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
        order: i + 2,
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

export async function seedFaqPage(prisma: PrismaClient) {
  const faqPage = await prisma.page.upsert({
    where: { slug: "faq" },
    update: {
      title: "FAQ",
      content: "[]",
      metaDescription: "site frequently asked questions",
      showInFooter: true,
      footerOrder: 2,
      showInHeader: true,
      headerOrder: 2,
      icon: "BadgeQuestionMark",
    },
    create: {
      slug: "faq",
      title: "FAQ",
      type: "FAQ",
      heroImage: null,
      content: "[]",
      metaDescription: "site frequently asked questions",
      showInFooter: true,
      footerOrder: 2,
      showInHeader: true,
      headerOrder: 2,
      isPublished: true,
      publishedAt: new Date(),
      generatedBy: "manual",
      icon: "BadgeQuestionMark",
    },
  });

  await prisma.block.deleteMany({ where: { pageId: faqPage.id } });

  await prisma.block.create({
    data: {
      pageId: faqPage.id,
      type: "hero",
      order: 0,
      isDeleted: false,
      content: {
        heading: "Frequently Asked Questions",
        imageUrl: getPlaceholderBanner("faq-hero"),
        imageAlt: "Coffee beans background",
        caption:
          "Find answers to common questions about our coffee, orders, shipping, and more.",
      },
    },
  });

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
}

export async function seedCmsPages(prisma: PrismaClient) {
  console.log("  📄 Creating CMS pages...");

  const locationTypeSetting = await prisma.siteSettings.findUnique({
    where: { key: "app.locationType" },
  });
  const LOCATION_TYPE = locationTypeSetting?.value || "MULTI";

  await seedAboutPage(prisma);
  await seedCafePage(prisma, LOCATION_TYPE);
  await seedFaqPage(prisma);

  // Optional supporting pages and navigation links
  await prisma.page.upsert({
    where: { slug: "brewing" },
    update: {
      title: "Brewing Guides",
      content:
        "\n        <h2>Master the Art of Coffee Brewing</h2>\n        <p>Explore our comprehensive brewing guides to make the perfect cup of coffee at home.</p>\n        <p>Choose your preferred brewing method below to get started.</p>\n      ",
      metaDescription:
        "Learn how to brew perfect coffee with our step-by-step guides for various brewing methods.",
      showInFooter: true,
      footerOrder: 6,
      showInHeader: false,
      headerOrder: null,
      heroImage: null,
      icon: null,
    },
    create: {
      slug: "brewing",
      title: "Brewing Guides",
      type: "GENERIC",
      heroImage: null,
      content:
        "\n        <h2>Master the Art of Coffee Brewing</h2>\n        <p>Explore our comprehensive brewing guides to make the perfect cup of coffee at home.</p>\n        <p>Choose your preferred brewing method below to get started.</p>\n      ",
      parentId: null,
      showInFooter: true,
      footerOrder: 6,
      metaDescription:
        "Learn how to brew perfect coffee with our step-by-step guides for various brewing methods.",
      isPublished: true,
      publishedAt: new Date(),
      generatedBy: "manual",
      icon: null,
      showInHeader: false,
      headerOrder: null,
    },
  });

  const linkPages = [
    {
      slug: "link-about",
      title: "Project",
      url: "/about",
      icon: "Code",
      showInHeader: true,
      headerOrder: 4,
      showInFooter: true,
      footerOrder: 4,
    },
    {
      slug: "link-features",
      title: "Features",
      url: "/features",
      icon: "Sparkles",
      showInHeader: true,
      headerOrder: 5,
      showInFooter: true,
      footerOrder: 5,
    },
    {
      slug: "link-contact",
      title: "Contact",
      url: "/contact",
      icon: "Mail",
      showInHeader: false,
      headerOrder: null,
      showInFooter: true,
      footerOrder: 6,
    },
  ];

  for (const link of linkPages) {
    await prisma.page.upsert({
      where: { slug: link.slug },
      update: {
        title: link.title,
        url: link.url,
        type: "LINK",
        showInHeader: link.showInHeader,
        headerOrder: link.headerOrder,
        showInFooter: link.showInFooter,
        footerOrder: link.footerOrder,
        icon: link.icon,
        content: "",
      },
      create: {
        slug: link.slug,
        title: link.title,
        type: "LINK",
        heroImage: null,
        content: "",
        parentId: null,
        showInFooter: link.showInFooter,
        footerOrder: link.footerOrder,
        metaDescription: "",
        isPublished: true,
        publishedAt: null,
        generatedBy: null,
        generatedAt: null,
        icon: link.icon,
        headerOrder: link.headerOrder,
        showInHeader: link.showInHeader,
        url: link.url,
      },
    });
  }

  console.log("  ✅ CMS pages created");
}
