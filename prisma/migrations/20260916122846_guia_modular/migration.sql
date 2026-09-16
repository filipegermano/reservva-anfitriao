/*
  Warnings:

  - You are about to drop the column `checkInInstructions` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `checkInTime` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutInstructions` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutTime` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `houseRules` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `wifiName` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `wifiPassword` on the `Property` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "GuideSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GuideSection_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GuestFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "guestName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuestFeedback_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migra os campos fixos antigos (Wi-Fi, check-in/out, regras) para seções
-- do guia antes de remover as colunas, preservando o conteúdo existente.
INSERT INTO "GuideSection" ("id", "propertyId", "type", "title", "enabled", "order", "content", "updatedAt")
SELECT lower(hex(randomblob(12))), "id", 'wifi', 'Wi-Fi', true, 0,
       json_object(
         'networks', json_array(json_object('name', coalesce("wifiName", ''), 'password', coalesce("wifiPassword", ''))),
         'notes', '', 'tips', ''
       ),
       CURRENT_TIMESTAMP
FROM "Property"
WHERE coalesce("wifiName", '') <> '' OR coalesce("wifiPassword", '') <> '';

INSERT INTO "GuideSection" ("id", "propertyId", "type", "title", "enabled", "order", "content", "updatedAt")
SELECT lower(hex(randomblob(12))), "id", 'checkin', 'Check-in/Check-out', true, 1,
       json_object(
         'checkInTime', coalesce("checkInTime", ''),
         'checkOutTime', coalesce("checkOutTime", ''),
         'checkInInstructions', coalesce("checkInInstructions", ''),
         'checkOutInstructions', coalesce("checkOutInstructions", ''),
         'keyLocation', '', 'flexible', json('false')
       ),
       CURRENT_TIMESTAMP
FROM "Property"
WHERE coalesce("checkInTime", '') <> '' OR coalesce("checkInInstructions", '') <> ''
   OR coalesce("checkOutTime", '') <> '' OR coalesce("checkOutInstructions", '') <> '';

INSERT INTO "GuideSection" ("id", "propertyId", "type", "title", "enabled", "order", "content", "updatedAt")
SELECT lower(hex(randomblob(12))), "id", 'rules', 'Regras da Casa', true, 2,
       json_object('rules', json_array(json_object('text', "houseRules"))),
       CURRENT_TIMESTAMP
FROM "Property"
WHERE coalesce("houseRules", '') <> '';

INSERT INTO "GuideSection" ("id", "propertyId", "type", "title", "enabled", "order", "content", "updatedAt")
SELECT lower(hex(randomblob(12))), "id", 'local_tips', 'Dicas Locais', true, 3,
       json_object('intro', ''), CURRENT_TIMESTAMP
FROM "Property"
WHERE EXISTS (SELECT 1 FROM "Recommendation" r WHERE r."propertyId" = "Property"."id" AND r."category" <> 'RESTAURANTE');

INSERT INTO "GuideSection" ("id", "propertyId", "type", "title", "enabled", "order", "content", "updatedAt")
SELECT lower(hex(randomblob(12))), "id", 'restaurants', 'Restaurantes', true, 4,
       json_object('intro', ''), CURRENT_TIMESTAMP
FROM "Property"
WHERE EXISTS (SELECT 1 FROM "Recommendation" r WHERE r."propertyId" = "Property"."id" AND r."category" = 'RESTAURANTE');

INSERT INTO "GuideSection" ("id", "propertyId", "type", "title", "enabled", "order", "content", "updatedAt")
SELECT lower(hex(randomblob(12))), "id", 'about', 'Sobre a Casa', true, 5,
       json_object(
         'guests', coalesce("guestCapacity", 0),
         'bedrooms', coalesce("bedrooms", 0),
         'beds', 0,
         'bathrooms', coalesce("bathrooms", 0),
         'description', coalesce("overview", ''),
         'features', json_array()
       ),
       CURRENT_TIMESTAMP
FROM "Property"
WHERE "guestCapacity" IS NOT NULL OR "bedrooms" IS NOT NULL OR "bathrooms" IS NOT NULL
   OR coalesce("overview", '') <> '';

INSERT INTO "GuideSection" ("id", "propertyId", "type", "title", "enabled", "order", "content", "updatedAt")
SELECT lower(hex(randomblob(12))), p."id", 'amenities', 'Comodidades', true, 6,
       json_object('items', json((
         SELECT json_group_array("label") FROM (
           SELECT a."label" FROM "Amenity" a WHERE a."propertyId" = p."id" ORDER BY a."order"
         )
       ))),
       CURRENT_TIMESTAMP
FROM "Property" p
WHERE EXISTS (SELECT 1 FROM "Amenity" a WHERE a."propertyId" = p."id");

INSERT INTO "GuideSection" ("id", "propertyId", "type", "title", "enabled", "order", "content", "updatedAt")
SELECT lower(hex(randomblob(12))), p."id", 'rooms', 'Ambientes', true, 7,
       json_object('rooms', json((
         SELECT json_group_array(json_object('name', "label", 'description', '', 'photos', json("photos"))) FROM (
           SELECT "label", json_group_array("imageUrl") AS "photos", min("order") AS "first" FROM (
             SELECT r."label", r."imageUrl", r."order" FROM "RoomPhoto" r WHERE r."propertyId" = p."id" ORDER BY r."order"
           ) GROUP BY "label" ORDER BY "first"
         )
       ))),
       CURRENT_TIMESTAMP
FROM "Property" p
WHERE EXISTS (SELECT 1 FROM "RoomPhoto" r WHERE r."propertyId" = p."id");

-- Comodidades e fotos de ambientes agora vivem no conteúdo das seções.
DROP TABLE "Amenity";
DROP TABLE "RoomPhoto";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "propertyType" TEXT,
    "address" TEXT,
    "city" TEXT,
    "coverImageUrl" TEXT,
    "showCover" BOOLEAN NOT NULL DEFAULT true,
    "welcomeMessage" TEXT,
    "shortDescription" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'moderno',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "sourceUrl" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Guias criados antes desta migração já eram públicos: continuam publicados.
INSERT INTO "new_Property" ("address", "coverImageUrl", "createdAt", "id", "name", "slug", "updatedAt", "userId", "welcomeMessage", "published", "publishedAt") SELECT "address", "coverImageUrl", "createdAt", "id", "name", "slug", "updatedAt", "userId", "welcomeMessage", true, CURRENT_TIMESTAMP FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GuideSection_propertyId_type_key" ON "GuideSection"("propertyId", "type");
