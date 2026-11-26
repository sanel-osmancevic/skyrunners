-- CreateTable
CREATE TABLE "ClubRace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "location" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClubRace_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClubRaceDistance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raceId" TEXT NOT NULL,
    "distanceKm" REAL NOT NULL,
    CONSTRAINT "ClubRaceDistance_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "ClubRace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubRaceDistance_raceId_distanceKm_key" ON "ClubRaceDistance"("raceId", "distanceKm");
