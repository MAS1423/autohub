ALTER TABLE `users`
  ADD COLUMN `whatsapp` varchar(30) NULL;

CREATE TABLE `vehicle_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `requestCode` varchar(40) NOT NULL,
  `userId` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `whatsapp` varchar(30) NOT NULL,
  `email` varchar(320),
  `brand` varchar(100),
  `bodyType` varchar(80),
  `models` text,
  `trim` varchar(100),
  `condition` enum('new','used'),
  `minPrice` int,
  `maxPrice` int,
  `targetPrice` int,
  `minYear` int,
  `message` text NOT NULL,
  `matchedDealers` int NOT NULL DEFAULT 0,
  `status` enum('submitted','distributed','closed') NOT NULL DEFAULT 'submitted',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `vehicle_requests_id` PRIMARY KEY(`id`),
  CONSTRAINT `vehicle_requests_requestCode_unique` UNIQUE(`requestCode`)
);
