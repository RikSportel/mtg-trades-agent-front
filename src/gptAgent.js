// React frontend agent interface
import { useState } from "react";

export function useAgent() {
	const [messages, setMessages] = useState([]);
	async function sendMessage(userInput) {
		// Make a POST request to the backend agent
		const agentUrl = process.env.REACT_APP_MTG_AGENT_URL;
		if (!agentUrl) {
			console.error("REACT_APP_MTG_AGENT_URL is not defined.");
			throw new Error("Agent URL is not defined.");
		}
		console.log("Sending request to:", agentUrl);
		let res;
		try {
			res = await fetch(agentUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: userInput })
			});
		} catch (error) {
			console.error("Network error:", error);
			throw error;
		}
		if (!res.ok) {
			const errorText = await res.text();
			console.error("Response error:", res.status, errorText);
			throw new Error(`Agent error: ${res.status} ${errorText}`);
		}
		const data = await res.json();
		setMessages(data.messages);
		return data.messages;
	}

	return { messages, sendMessage };
}
