CREATE TABLE `activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`actor` varchar(160) NOT NULL,
	`action` varchar(60) NOT NULL,
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(120) NOT NULL,
	`isReviewer` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_accounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(60) NOT NULL,
	`sessionId` varchar(64),
	`applicationId` int,
	`trafficSource` varchar(160),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `application_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`docType` varchar(40) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`mimeType` varchar(120),
	`fileSize` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `application_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referenceNumber` varchar(24),
	`resumeToken` varchar(64) NOT NULL,
	`status` varchar(40) NOT NULL DEFAULT 'New Application',
	`isDraft` boolean NOT NULL DEFAULT true,
	`currentStep` int NOT NULL DEFAULT 0,
	`fullName` varchar(200),
	`email` varchar(320),
	`phone` varchar(40),
	`address1` varchar(255),
	`address2` varchar(255),
	`city` varchar(120),
	`state` varchar(80),
	`county` varchar(120),
	`zip` varchar(20),
	`country` varchar(80) DEFAULT 'United States',
	`weeklyAvailability` varchar(20),
	`preferredDays` json,
	`independentWorkComfort` boolean,
	`experienceAreas` json,
	`profession` varchar(160),
	`industry` varchar(120),
	`experienceDescription` text,
	`ackIndependentContractor` boolean,
	`ackNoLegalAdvice` boolean,
	`ackConfidentiality` boolean,
	`ackPerformanceComp` boolean,
	`ackRegistrationFee` boolean,
	`ackFinalCertification` boolean,
	`reviewerId` int,
	`interviewDate` timestamp,
	`agreementStatus` varchar(30) NOT NULL DEFAULT 'Not Started',
	`registrationFeeStatus` varchar(30) NOT NULL DEFAULT 'Not Started',
	`trainingStatus` varchar(30) NOT NULL DEFAULT 'Not Started',
	`activationDate` timestamp,
	`trafficSource` varchar(160),
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`),
	CONSTRAINT `applications_referenceNumber_unique` UNIQUE(`referenceNumber`),
	CONSTRAINT `applications_resumeToken_unique` UNIQUE(`resumeToken`)
);
--> statement-breakpoint
CREATE TABLE `email_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int,
	`templateKey` varchar(60) NOT NULL,
	`recipient` varchar(320) NOT NULL,
	`subject` varchar(300) NOT NULL,
	`htmlBody` text,
	`deliveryStatus` varchar(30) NOT NULL DEFAULT 'logged',
	`sentBy` varchar(160) NOT NULL DEFAULT 'system',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internal_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`adminId` int NOT NULL,
	`adminName` varchar(120) NOT NULL,
	`note` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `internal_notes_id` PRIMARY KEY(`id`)
);
