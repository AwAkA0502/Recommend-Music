-- CreateTable
CREATE TABLE `UserInput` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `age` INTEGER NOT NULL,
    `profession` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `mood` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Track` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `track_name` VARCHAR(191) NOT NULL,
    `artist_name` VARCHAR(191) NOT NULL,
    `track_id` VARCHAR(191) NOT NULL,
    `danceability` DOUBLE NOT NULL,
    `energy` DOUBLE NOT NULL,
    `valence` DOUBLE NOT NULL,
    `tempo` DOUBLE NOT NULL,
    `mood_label` VARCHAR(191) NOT NULL,
    `dummy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
