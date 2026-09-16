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
    "theme" TEXT NOT NULL DEFAULT 'grafite',
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
INSERT INTO "new_Property" ("address", "city", "coverImageUrl", "createdAt", "id", "latitude", "longitude", "name", "propertyType", "published", "publishedAt", "shortDescription", "showCover", "slug", "sourceUrl", "theme", "updatedAt", "userId", "viewCount", "welcomeMessage") SELECT "address", "city", "coverImageUrl", "createdAt", "id", "latitude", "longitude", "name", "propertyType", "published", "publishedAt", "shortDescription", "showCover", "slug", "sourceUrl", "theme", "updatedAt", "userId", "viewCount", "welcomeMessage" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
