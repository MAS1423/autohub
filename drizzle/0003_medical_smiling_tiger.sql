ALTER TABLE `dealers` ADD `instagram` varchar(200);--> statement-breakpoint
ALTER TABLE `dealers` ADD `twitter` varchar(200);--> statement-breakpoint
ALTER TABLE `dealers` ADD `snapchat` varchar(200);--> statement-breakpoint
ALTER TABLE `dealers` ADD `tiktok` varchar(200);--> statement-breakpoint
ALTER TABLE `dealers` ADD `website` varchar(300);--> statement-breakpoint
ALTER TABLE `dealers` ADD `workingHoursDetail` text;--> statement-breakpoint
ALTER TABLE `dealers` ADD `planStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `dealers` ADD `planEndDate` timestamp;--> statement-breakpoint
ALTER TABLE `dealers` ADD `stripeCustomerId` varchar(100);--> statement-breakpoint
ALTER TABLE `dealers` ADD `stripeSubscriptionId` varchar(100);--> statement-breakpoint
ALTER TABLE `dealers` ADD `rejectionReason` text;--> statement-breakpoint
ALTER TABLE `dealers` ADD `status` enum('pending','active','suspended','rejected') DEFAULT 'pending' NOT NULL;