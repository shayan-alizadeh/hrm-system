-- CreateTable
CREATE TABLE `payrolls` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `salaryPeriod` VARCHAR(7) NOT NULL,
    `baseSalary` INTEGER NOT NULL,
    `bonuses` INTEGER NOT NULL DEFAULT 0,
    `deduction` INTEGER NOT NULL DEFAULT 0,
    `totalAmount` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PAID') NOT NULL DEFAULT 'PENDING',
    `paymentDate` DATETIME(3) NULL,
    `notes` VARCHAR(250) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
