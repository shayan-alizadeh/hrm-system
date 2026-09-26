/*
  Warnings:

  - You are about to drop the column `bonuses` on the `payrolls` table. All the data in the column will be lost.
  - You are about to drop the column `deductions` on the `payrolls` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `payrolls` table. All the data in the column will be lost.
  - You are about to drop the column `payPeriod` on the `payrolls` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDate` on the `payrolls` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `payrolls` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `payrolls` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,year,month]` on the table `payrolls` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `grossSalary` to the `payrolls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insuranceDeduction` to the `payrolls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `payrolls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `netSalary` to the `payrolls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxDeduction` to the `payrolls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAllowances` to the `payrolls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unpaidLeaveDeduction` to the `payrolls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `payrolls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `payrolls` DROP COLUMN `bonuses`,
    DROP COLUMN `deductions`,
    DROP COLUMN `notes`,
    DROP COLUMN `payPeriod`,
    DROP COLUMN `paymentDate`,
    DROP COLUMN `status`,
    DROP COLUMN `totalAmount`,
    ADD COLUMN `grossSalary` DOUBLE NOT NULL,
    ADD COLUMN `insuranceDeduction` DOUBLE NOT NULL,
    ADD COLUMN `month` INTEGER NOT NULL,
    ADD COLUMN `netSalary` DOUBLE NOT NULL,
    ADD COLUMN `taxDeduction` DOUBLE NOT NULL,
    ADD COLUMN `totalAllowances` DOUBLE NOT NULL,
    ADD COLUMN `unpaidLeaveDeduction` DOUBLE NOT NULL,
    ADD COLUMN `year` INTEGER NOT NULL,
    MODIFY `baseSalary` DOUBLE NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `payrolls_userId_year_month_key` ON `payrolls`(`userId`, `year`, `month`);
