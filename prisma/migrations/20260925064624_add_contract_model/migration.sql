-- CreateTable
CREATE TABLE `contracts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `contractNo` VARCHAR(50) NOT NULL,
    `jobTitle` VARCHAR(100) NOT NULL,
    `type` ENUM('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'PROBATION') NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    `startDate` VARCHAR(10) NOT NULL,
    `endDate` VARCHAR(10) NOT NULL,
    `baseSalary` DOUBLE NOT NULL,
    `housingAllowance` DOUBLE NOT NULL DEFAULT 0,
    `foodAllowance` DOUBLE NOT NULL DEFAULT 0,
    `childAllowance` DOUBLE NOT NULL DEFAULT 0,
    `insuranceNo` VARCHAR(20) NULL,
    `fileUrl` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `contracts_contractNo_key`(`contractNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
