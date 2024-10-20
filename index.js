import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
const PORT = process.env.PORT || 3000;

dotenv.config();

const token = process.env.AZURE_API_KEY;

const client = new ModelClient(
    "https://models.inference.ai.azure.com",
    new AzureKeyCredential(token)
);

const app = express();
app.use(express.static("public"));
app.use(cors());
app.use(express.json());
app.use(express.static("."));

async function getResponse(userInput, conversationHistory) {
    conversationHistory.push({ role: "user", content: userInput });

    const response = await client.path("/chat/completions").post({
        body: {
            messages: conversationHistory,
            model: "gpt-4o",
            temperature: 0.8,
            max_tokens: 8000,
            top_p: 1
        }
    });

    if (response.status !== "200") {
        throw response.body.error;
    }

    const aiMessage = response.body.choices[0].message.content;
    conversationHistory.push({ role: "assistant", content: aiMessage });

    return aiMessage;
}

app.post("/chat", async (req, res) => {
    const { message, history } = req.body;
    try {
        const aiResponse = await getResponse(message, history);
        res.json({ response: aiResponse });
    } catch (err) {
        console.error("The sample encountered an error:", err);
        res.status(500).json({ error: "An error occurred while processing your request." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
