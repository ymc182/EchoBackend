import axios from "axios";

export async function getUserWithToken(token: string) {
	try {
		const user = await axios.get("https://discord.com/api/users/@me", make_config(token));
		if (user.status !== 200) {
			throw new Error("Failed to get user");
		}

		return user.data;
	} catch (err) {
		console.log(err);
		return null;
	}
}

export async function exchangeDiscordCode(code: string) {
	const data_for_token_exchange = new URLSearchParams();
	data_for_token_exchange.append("client_id", process.env.CLIENT_ID!);
	data_for_token_exchange.append("client_secret", process.env.CLIENT_SECRET!);
	data_for_token_exchange.append("grant_type", "authorization_code");
	data_for_token_exchange.append("code", code);
	data_for_token_exchange.append("redirect_uri", process.env.REDIRECT_URI!);
	data_for_token_exchange.append("scope", "identify");
	try {
		const discord_token = await axios.post("https://discord.com/api/oauth2/token", data_for_token_exchange, {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Accept-Encoding": "*",
			},
		});

		if (discord_token.status !== 200) {
			throw new Error("Failed to exchange code for token");
		}

		return discord_token.data.access_token;
	} catch (err) {
		return null;
	}
}

export function make_config(authorization_token: string) {
	// Define the function
	const data = {
		// Define "data"
		headers: {
			// Define "headers" of "data"
			authorization: `Bearer ${authorization_token}`, // Define the authorization
			"Accept-Encoding": "*",
		},
	};
	return data; // Return the created object
}
