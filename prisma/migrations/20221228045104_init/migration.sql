/*
  Warnings:

  - Added the required column `discord_username` to the `DiscordUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DiscordUser" ADD COLUMN     "discord_username" TEXT NOT NULL;
