// React frontend agent interface
import { useState } from "react";

export function useAgent() {
	const [messages, setMessages] = useState([]);
	async function sendMessage(userInput) {
		// Make a POST request to the backend agent
			const agentUrl = process.env.REACT_APP_MTG_AGENT_URL;
			const res = await fetch(agentUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userInput, messages })
			});
		const data = await res.json();
		setMessages(data.messages);
		return data.messages;
	}

	return { messages, sendMessage };
}
