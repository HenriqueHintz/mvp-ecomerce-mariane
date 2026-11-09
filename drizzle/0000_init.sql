CREATE TABLE IF NOT EXISTS `brands` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL UNIQUE,
	`logo_url` text,
	`description` text
);

CREATE TABLE IF NOT EXISTS `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL UNIQUE,
	`icon` text,
	`display_order` integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL UNIQUE,
	`sku` text,
	`brand_id` text REFERENCES `brands`(`id`),
	`category_id` text REFERENCES `categories`(`id`),
	`price` real NOT NULL,
	`promo_price` real,
	`installment_count` integer DEFAULT 10,
	`installment_value` real,
	`pix_discount_percent` real DEFAULT 5,
	`stock` integer DEFAULT 15,
	`description` text,
	`how_to_use` text,
	`volume` text,
	`rating` real,
	`review_count` integer DEFAULT 0,
	`is_featured` integer DEFAULT 0,
	`is_best_seller` integer DEFAULT 0,
	`created_at` text
);

CREATE TABLE IF NOT EXISTS `product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL REFERENCES `products`(`id`),
	`url` text NOT NULL,
	`is_primary` integer DEFAULT 0,
	`display_order` integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_email` text,
	`channel` text DEFAULT 'whatsapp',
	`status` text DEFAULT 'aguardando pagamento',
	`total` real NOT NULL,
	`payment_method` text,
	`shipping_address` text,
	`notes` text,
	`created_at` text
);

CREATE TABLE IF NOT EXISTS `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL REFERENCES `orders`(`id`),
	`product_id` text NOT NULL REFERENCES `products`(`id`),
	`product_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL
);

CREATE TABLE IF NOT EXISTS `payment_webhooks` (
	`event_id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`provider` text NOT NULL,
	`status` text NOT NULL,
	`payload` text,
	`processed_at` text NOT NULL
);


