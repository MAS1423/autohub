CREATE TABLE `dealers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(200) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`logo` text,
	`cover` text,
	`bio` text,
	`phone` varchar(30),
	`whatsapp` varchar(30),
	`email` varchar(200),
	`city` varchar(100),
	`neighborhood` varchar(100),
	`lat` float,
	`lng` float,
	`address` text,
	`workingHours` varchar(200),
	`brands` text,
	`isVerified` boolean NOT NULL DEFAULT false,
	`plan` enum('free','basic','pro','premium') NOT NULL DEFAULT 'free',
	`commercialReg` varchar(100),
	`views` int NOT NULL DEFAULT 0,
	`vehiclesCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealers_id` PRIMARY KEY(`id`),
	CONSTRAINT `dealers_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealerId` int NOT NULL,
	`vehicleId` int,
	`userId` int,
	`name` varchar(200),
	`phone` varchar(30),
	`message` text NOT NULL,
	`status` enum('new','read','replied') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealerId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealerId` int NOT NULL,
	`brand` varchar(100) NOT NULL,
	`model` varchar(100) NOT NULL,
	`year` int NOT NULL,
	`price` int NOT NULL,
	`condition` enum('new','used') NOT NULL,
	`fuelType` enum('petrol','diesel','hybrid','electric') NOT NULL DEFAULT 'petrol',
	`transmission` enum('automatic','manual') NOT NULL DEFAULT 'automatic',
	`color` varchar(80),
	`mileage` int NOT NULL DEFAULT 0,
	`description` text,
	`images` text,
	`status` enum('available','reserved','sold') NOT NULL DEFAULT 'available',
	`views` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
