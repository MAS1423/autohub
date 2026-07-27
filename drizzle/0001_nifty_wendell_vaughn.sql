CREATE TABLE `dealer_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealerId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`views` int NOT NULL DEFAULT 0,
	`inquiries` int NOT NULL DEFAULT 0,
	`vehicleViews` int NOT NULL DEFAULT 0,
	CONSTRAINT `dealer_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealerId` int NOT NULL,
	`vehicleId` int,
	`fileKey` text NOT NULL,
	`fileUrl` text NOT NULL,
	`fileType` enum('image','video','logo','cover') NOT NULL,
	`mimeType` varchar(100),
	`originalName` varchar(255),
	`sizeBytes` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `vehicles` ADD `videoUrl` text;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `videoKey` text;