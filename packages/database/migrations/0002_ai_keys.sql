CREATE TABLE `ai_api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`provider` text DEFAULT 'ollama' NOT NULL,
	`secret_ciphertext` text NOT NULL,
	`secret_iv` text NOT NULL,
	`secret_last4` text NOT NULL,
	`secret_fingerprint` text NOT NULL,
	`base_url` text NOT NULL,
	`model` text,
	`priority` integer DEFAULT 100 NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`daily_request_limit` integer DEFAULT 0 NOT NULL,
	`last_success_at` integer,
	`last_error_at` integer,
	`last_error_message` text,
	`last_checked_at` integer,
	`available_models` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "ai_api_keys_priority_check" CHECK("ai_api_keys"."priority" >= 0 AND "ai_api_keys"."priority" <= 1000),
	CONSTRAINT "ai_api_keys_daily_limit_check" CHECK("ai_api_keys"."daily_request_limit" >= 0)
);
--> statement-breakpoint
CREATE INDEX `ai_api_keys_enabled_priority_idx` ON `ai_api_keys` (`is_enabled`,`priority`);
--> statement-breakpoint
CREATE TABLE `ai_usage_daily` (
	`key_id` text NOT NULL,
	`day` text NOT NULL,
	`requests` integer DEFAULT 0 NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`prompt_tokens` integer DEFAULT 0 NOT NULL,
	`completion_tokens` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`key_id`, `day`),
	FOREIGN KEY (`key_id`) REFERENCES `ai_api_keys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ai_usage_daily_day_idx` ON `ai_usage_daily` (`day`);
--> statement-breakpoint
INSERT OR IGNORE INTO permissions (id, key, description) VALUES ('perm_ai_manage', 'ai:manage', 'Quản lý khóa API trí tuệ nhân tạo');
--> statement-breakpoint
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) SELECT 'role_super_admin', 'perm_ai_manage' WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = 'role_super_admin' AND permission_id = 'perm_ai_manage');
