CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_provider_idx` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`start_day` text NOT NULL,
	`days` integer NOT NULL,
	`daily_minutes` integer NOT NULL,
	`time_zone` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_challenge_idx` ON `challenges` (`start_day`) WHERE "challenges"."kind" = 'monthly';--> statement-breakpoint
CREATE TABLE `timer_commands` (
	`user_id` text NOT NULL,
	`request_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`result` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `command_member_request_idx` ON `timer_commands` (`user_id`,`request_id`);--> statement-breakpoint
CREATE TABLE `focus_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source` text NOT NULL,
	`kind` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`planned_duration_ms` integer,
	`deadline_at_ms` integer,
	`round` integer DEFAULT 1 NOT NULL,
	`rounds` integer DEFAULT 4 NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`task_id` text,
	`tag_id` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`timing_edited` integer DEFAULT false NOT NULL,
	`created_at_ms` integer NOT NULL,
	`deleted_at_ms` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `focus_sessions_owner_time_idx` ON `focus_sessions` (`user_id`,`created_at_ms`);--> statement-breakpoint
CREATE UNIQUE INDEX `one_active_timer_per_member` ON `focus_sessions` (`user_id`) WHERE "focus_sessions"."status" in ('running', 'paused');--> statement-breakpoint
CREATE TABLE `friendships` (
	`id` text PRIMARY KEY NOT NULL,
	`first_id` text NOT NULL,
	`second_id` text NOT NULL,
	`requester_id` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`first_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`second_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requester_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ordered_friend_pair" CHECK("friendships"."first_id" < "friendships"."second_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friendship_pair_idx` ON `friendships` (`first_id`,`second_id`);--> statement-breakpoint
CREATE TABLE `instance` (
	`id` integer PRIMARY KEY NOT NULL,
	`time_zone` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `intervals` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`start_at_ms` integer NOT NULL,
	`end_at_ms` integer,
	FOREIGN KEY (`session_id`) REFERENCES `focus_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "positive_interval" CHECK("intervals"."end_at_ms" is null or "intervals"."end_at_ms" > "intervals"."start_at_ms")
);
--> statement-breakpoint
CREATE INDEX `interval_session_idx` ON `intervals` (`session_id`);--> statement-breakpoint
CREATE TABLE `kudos` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`day` text NOT NULL,
	FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "no_self_kudos" CHECK("kudos"."sender_id" <> "kudos"."recipient_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `kudos_pair_day_idx` ON `kudos` (`sender_id`,`recipient_id`,`day`);--> statement-breakpoint
CREATE TABLE `members` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`primary_focus` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`time_zone` text DEFAULT 'Europe/Berlin' NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`sound` integer DEFAULT false NOT NULL,
	`focus_minutes` integer DEFAULT 25 NOT NULL,
	`break_minutes` integer DEFAULT 5 NOT NULL,
	`rounds` integer DEFAULT 4 NOT NULL,
	`daily_goal_minutes` integer DEFAULT 0 NOT NULL,
	`weekly_goal_minutes` integer DEFAULT 0 NOT NULL,
	`leaderboard_opt_in` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `participations` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge_id` text NOT NULL,
	`user_id` text NOT NULL,
	`share_results` integer DEFAULT false NOT NULL,
	`cancelled_at_ms` integer,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `challenge_member_idx` ON `participations` (`challenge_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `auth_session` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_session_token_unique` ON `auth_session` (`token`);--> statement-breakpoint
CREATE INDEX `auth_session_user_idx` ON `auth_session` (`user_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#0d9488' NOT NULL,
	`archived_at_ms` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tags_owner_idx` ON `tags` (`user_id`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`estimate_minutes` integer DEFAULT 0 NOT NULL,
	`tag_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`archived_at_ms` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `tasks_owner_idx` ON `tasks` (`user_id`);--> statement-breakpoint
CREATE TABLE `timing_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`intervals` text NOT NULL,
	`changed_at_ms` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `focus_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `timing_revision_session_idx` ON `timing_revisions` (`session_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);