/*
  Warnings:

  - You are about to drop the column `acceptedAt` on the `MemberProfile` table. All the data in the column will be lost.
  - You are about to drop the column `acceptedRules` on the `MemberProfile` table. All the data in the column will be lost.
  - You are about to drop the column `bloodType` on the `MemberProfile` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyName` on the `MemberProfile` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyPhone` on the `MemberProfile` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyRelation` on the `MemberProfile` table. All the data in the column will be lost.
  - You are about to drop the column `experienceLevel` on the `MemberProfile` table. All the data in the column will be lost.
  - You are about to drop the column `healthNotes` on the `MemberProfile` table. All the data in the column will be lost.
  - You are about to drop the column `itraId` on the `MemberProfile` table. All the data in the column will be lost.
  - You are about to drop the column `photoConsent` on the `MemberProfile` table. All the data in the column will be lost.
  - You are about to drop the column `stravaUrl` on the `MemberProfile` table. All the data in the column will be lost.
  - You are about to drop the column `tShirtSize` on the `MemberProfile` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MemberProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MemberProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MemberProfile" ("address", "city", "createdAt", "dateOfBirth", "firstName", "gender", "id", "lastName", "phone", "updatedAt", "userId") SELECT "address", "city", "createdAt", "dateOfBirth", "firstName", "gender", "id", "lastName", "phone", "updatedAt", "userId" FROM "MemberProfile";
DROP TABLE "MemberProfile";
ALTER TABLE "new_MemberProfile" RENAME TO "MemberProfile";
CREATE UNIQUE INDEX "MemberProfile_userId_key" ON "MemberProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
