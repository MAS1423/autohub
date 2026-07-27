ALTER TABLE `dealers` ADD `dealerType` enum('sell','buy','both') DEFAULT 'sell' NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `city` varchar(100);