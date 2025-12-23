/*
  Warnings:

  - You are about to drop the column `showInFooterMenu` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `showInHeaderMenu` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `showInMobileMenu` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `showInFooterMenu` on the `CategoryLabel` table. All the data in the column will be lost.
  - You are about to drop the column `showInHeaderMenu` on the `CategoryLabel` table. All the data in the column will be lost.
  - You are about to drop the column `showInMobileMenu` on the `CategoryLabel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "showInFooterMenu",
DROP COLUMN "showInHeaderMenu",
DROP COLUMN "showInMobileMenu";

-- AlterTable
ALTER TABLE "CategoryLabel" DROP COLUMN "showInFooterMenu",
DROP COLUMN "showInHeaderMenu",
DROP COLUMN "showInMobileMenu";
