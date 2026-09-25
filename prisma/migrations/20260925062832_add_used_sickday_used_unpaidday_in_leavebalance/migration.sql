-- AlterTable
ALTER TABLE `leave_balances` ADD COLUMN `usedSickDays` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `usedUnpaidDays` DOUBLE NOT NULL DEFAULT 0;
