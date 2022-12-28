-- CreateTable
CREATE TABLE "DiscordUser" (
    "discord_id" TEXT NOT NULL,
    "wallet_id" TEXT[],
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscordUser_pkey" PRIMARY KEY ("discord_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordUser_discord_id_key" ON "DiscordUser"("discord_id");
