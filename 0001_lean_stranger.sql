CREATE TABLE `game_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(100) NOT NULL,
	`rating` int NOT NULL DEFAULT 5,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(150) NOT NULL,
	`slug` varchar(150) NOT NULL,
	`description` text NOT NULL,
	`instructions` text,
	`category` varchar(50) NOT NULL DEFAULT 'action',
	`thumbnailUrl` text NOT NULL,
	`gameType` enum('html5','embed','external') NOT NULL DEFAULT 'html5',
	`gameCode` text,
	`externalUrl` text,
	`authorId` int NOT NULL,
	`authorName` varchar(100) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'approved',
	`rejectionReason` text,
	`playCount` int NOT NULL DEFAULT 0,
	`favoriteCount` int NOT NULL DEFAULT 0,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `games_id` PRIMARY KEY(`id`),
	CONSTRAINT `games_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'password';--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);