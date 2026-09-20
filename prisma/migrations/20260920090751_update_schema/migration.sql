/*
  Warnings:

  - You are about to drop the column `j_date` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `deduction` on the `payrolls` table. All the data in the column will be lost.
  - You are about to drop the column `salaryPeriod` on the `payrolls` table. All the data in the column will be lost.
  - You are about to alter the column `mobile` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(15)`.
  - A unique constraint covering the columns `[nationalCode]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `attendanceDate` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payPeriod` to the `payrolls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `refresh_tokens` DROP FOREIGN KEY `refresh_tokens_userId_fkey`;

-- DropIndex
DROP INDEX `refresh_tokens_userId_fkey` ON `refresh_tokens`;

-- AlterTable
ALTER TABLE `attendances` DROP COLUMN `j_date`,
    ADD COLUMN `attendanceDate` VARCHAR(10) NOT NULL;

-- AlterTable
ALTER TABLE `payrolls` DROP COLUMN `deduction`,
    DROP COLUMN `salaryPeriod`,
    ADD COLUMN `deductions` BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN `payPeriod` VARCHAR(7) NOT NULL,
    MODIFY `baseSalary` BIGINT NOT NULL,
    MODIFY `bonuses` BIGINT NOT NULL DEFAULT 0,
    MODIFY `totalAmount` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `refresh_tokens` MODIFY `tokenHash` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `departmentId` INTEGER NULL,
    ADD COLUMN `firstName` VARCHAR(50) NOT NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `lastName` VARCHAR(50) NOT NULL,
    ADD COLUMN `nationalCode` VARCHAR(10) NULL,
    MODIFY `mobile` VARCHAR(15) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_nationalCode_key` ON `users`(`nationalCode`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
