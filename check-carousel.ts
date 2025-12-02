import { prisma } from "./lib/prisma";

async function main() {
  const block = await prisma.block.findFirst({
    where: {
      type: { in: ["imageCarousel", "locationCarousel"] },
    },
    select: {
      id: true,
      type: true,
      content: true,
    },
  });

  console.log(JSON.stringify(block, null, 2));
  await prisma.$disconnect();
}

main();
