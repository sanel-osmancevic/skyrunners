/*
  Warnings:

  - You are about to drop the column `ageCategory` on the `RaceResult` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RaceResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "distanceKm" REAL NOT NULL,
    "place" INTEGER,
    "teamPlace" INTEGER,
    "agePlace" INTEGER,
    "trkaEventId" TEXT,
    "trkaRaceId" TEXT,
    "raceName" TEXT,
    "timeSeconds" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RaceResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RaceResult" ("agePlace", "createdAt", "date", "distanceKm", "id", "name", "place", "raceName", "teamPlace", "timeSeconds", "trkaEventId", "trkaRaceId", "updatedAt", "userId") SELECT "agePlace", "createdAt", "date", "distanceKm", "id", "name", "place", "raceName", "teamPlace", "timeSeconds", "trkaEventId", "trkaRaceId", "updatedAt", "userId" FROM "RaceResult";
DROP TABLE "RaceResult";
ALTER TABLE "new_RaceResult" RENAME TO "RaceResult";
CREATE INDEX "RaceResult_userId_idx" ON "RaceResult"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
