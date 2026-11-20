-- AlterTable
ALTER TABLE `events` ADD COLUMN `isExam` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `isExam` BOOLEAN NOT NULL DEFAULT false;
