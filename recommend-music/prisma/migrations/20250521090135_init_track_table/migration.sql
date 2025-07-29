/*
  Warnings:

  - You are about to drop the column `danceability` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `dummy` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `energy` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `tempo` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `valence` on the `Track` table. All the data in the column will be lost.
  - Added the required column `description` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Track` DROP COLUMN `danceability`,
    DROP COLUMN `dummy`,
    DROP COLUMN `energy`,
    DROP COLUMN `tempo`,
    DROP COLUMN `valence`,
    ADD COLUMN `description` VARCHAR(191) NOT NULL;
