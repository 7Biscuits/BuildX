-- Track user email IDs deleted by each admin account.
ALTER TABLE "users" ADD COLUMN "deletedUsers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
