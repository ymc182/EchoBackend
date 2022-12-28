import express from "express";
import pkg from "body-parser";
import dotenv from "dotenv";
dotenv.config();
const { json } = pkg;
import { exchangeDiscordCode, getUserWithToken } from "./helper.js";
import { PrismaClient } from "@prisma/client";
const PORT = process.env.PORT || 3001;
const app = express();
app.use(json());

app.post("/auth", async (req, res) => {
	const code = req.body.code;
	const walletId = req.body.walletId;
	if (!code) {
		res.status(400).json({ success: false, message: "No code provided" });
		return;
	}
	const result = await exchangeDiscordCode(code);
	if (!result) {
		res.status(400).json({ success: false, message: "Failed to exchange code for token" });
		return;
	}
	const user = await getUserWithToken(result);
	if (!user) {
		res.status(400).json({ success: false, message: "Failed to get user" });
		return;
	}
	const prisma = new PrismaClient();
	const userExists = await prisma.discordUser.findUnique({ where: { discord_id: user.id } });
	if (!userExists) {
		const result = await prisma.discordUser.create({
			data: {
				discord_id: user.id,
				discord_username: user.username,
				wallet_id: [walletId],
			},
		});
		res.status(200).json({ success: true, result });
	} else {
		let wallets = userExists.wallet_id;
		if (!wallets.includes(walletId)) {
			wallets.push(walletId);
		}
		const result = await prisma.discordUser.update({
			where: { discord_id: user.id },
			data: {
				wallet_id: wallets,
			},
		});
		res.status(200).json({ success: true, result });
	}
});
//TODO: Gated route
/* app.get("/users", async (req, res) => {
	const prisma = new PrismaClient();
	const users = await prisma.discordUser.findMany();
	res.status(200).json({ success: true, users });
}); */
//TODO: Gated route
/* app.get("/user/:id", async (req, res) => {
	const id = req.params.id;
	const prisma = new PrismaClient();
	const user = await prisma.discordUser.findUnique({ where: { discord_id: id } });
	res.status(200).json({ success: true, user });
}); */

app.post("/delete", async (req, res) => {
	const code = req.body.code;
	if (!code) {
		res.status(400).json({ success: false, message: "No code provided" });
		return;
	}
	const result = await exchangeDiscordCode(code);
	if (!result) {
		res.status(400).json({ success: false, message: "Failed to exchange code for token" });
		return;
	}
	const user = await getUserWithToken(result);
	if (!user) {
		res.status(400).json({ success: false, message: "Failed to get user" });
		return;
	}
	const prisma = new PrismaClient();
	try {
		const userExists = await prisma.discordUser.delete({ where: { discord_id: user.id } });
		if (userExists) {
			res.status(200).json({ success: true, message: "User deleted" });
		} else {
			res.status(400).json({ success: false, message: "Failed to delete user" });
		}
	} catch (e) {
		res.status(400).json({ success: false, message: "User Not Found for deletion" });
	}
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});