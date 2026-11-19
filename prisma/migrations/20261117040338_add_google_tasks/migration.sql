/*
  Warnings:

  - A unique constraint covering the columns `[userId,googleTaskListId,googleTaskId]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `googleTaskId` VARCHAR(255) NULL,
    ADD COLUMN `googleTaskListId` VARCHAR(255) NULL,
    ADD COLUMN `source` ENUM('LOCAL', 'GTASKS') NOT NULL DEFAULT 'LOCAL';

-- CreateIndex
CREATE UNIQUE INDEX `tasks_userId_googleTaskListId_googleTaskId_key` ON `tasks`(`userId`, `googleTaskListId`, `googleTaskId`);
