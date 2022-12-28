import express from "express";
import pkg from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
import prisma from "./client.js";
const { json } = pkg;
import { exchangeDiscordCode, getUserWithToken } from "./helper.js";
const PORT = process.env.PORT || 3001;
const app = express();

app.use(json());
app.use(
	cors({
		origin: "*",
	})
);
app.get("/", (req, res) => {
	res.status(200).send(`Server active , timestamp: ${Date.now()}`);
});
app.post("/auth", async (req, res) => {
	const code = req.body.code;
	//TODO: Check Signature
	const walletId = req.body.walletId;
	const project = req.body.project;
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
		let projects = userExists.projects;
		if (!wallets.includes(walletId)) {
			wallets.push(walletId);
		}
		if (!projects.includes(project)) {
			projects.push(project);
		}
		const result = await prisma.discordUser.update({
			where: { discord_id: user.id },
			data: {
				wallet_id: wallets,
				projects: projects,
			},
		});
		res.status(200).json({ success: true, result });
	}
});
//TODO: Gated route
app.get("/users", async (req, res) => {
	const users = await prisma.discordUser.findMany();
	res.status(200).json({ success: true, users });
});
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
app.on("error", async (err) => {
	await prisma.$disconnect();
});
app.on("close", async () => {
	await prisma.$disconnect();
});
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
