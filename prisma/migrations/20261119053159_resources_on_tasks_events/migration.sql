-- AlterTable
ALTER TABLE `resources` ADD COLUMN `eventId` VARCHAR(191) NULL,
    ADD COLUMN `taskId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `resources_taskId_idx` ON `resources`(`taskId`);

-- CreateIndex
CREATE INDEX `resources_eventId_idx` ON `resources`(`eventId`);

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
