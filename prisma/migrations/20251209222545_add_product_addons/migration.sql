-- CreateTable
CREATE TABLE "ProductAddOn" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "addOnProductId" TEXT NOT NULL,
    "addOnVariantId" TEXT,
    "discountedPriceInCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductAddOn_productId_idx" ON "ProductAddOn"("productId");

-- CreateIndex
CREATE INDEX "ProductAddOn_addOnProductId_idx" ON "ProductAddOn"("addOnProductId");

-- CreateIndex
CREATE INDEX "ProductAddOn_addOnVariantId_idx" ON "ProductAddOn"("addOnVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAddOn_productId_addOnProductId_addOnVariantId_key" ON "ProductAddOn"("productId", "addOnProductId", "addOnVariantId");

-- AddForeignKey
ALTER TABLE "ProductAddOn" ADD CONSTRAINT "ProductAddOn_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAddOn" ADD CONSTRAINT "ProductAddOn_addOnProductId_fkey" FOREIGN KEY ("addOnProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAddOn" ADD CONSTRAINT "ProductAddOn_addOnVariantId_fkey" FOREIGN KEY ("addOnVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
