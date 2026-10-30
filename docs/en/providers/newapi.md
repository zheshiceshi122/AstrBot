# NewAPI

[NewAPI](http://newapi.ai/) is a next-generation LLM gateway and AI asset management system built on top of One API. It provides a unified interface for managing and using multiple AI model services, including OpenAI, Anthropic, Gemini, Midjourney, and more.

AstrBot can integrate with NewAPI as a model provider, so you can access those model services through AstrBot.

## Setup Steps

### 1. Create a NewAPI API Key

After registering and signing in to NewAPI, open `Console` in the top navigation bar, go to `Token Management`, then click `Add Token` to create a new API key with appropriate permissions.

![create-api-key](https://files.astrbot.app/docs/source/images/newapi/image.png)

After creation, copy the generated API key.

![copy-api-key](https://files.astrbot.app/docs/source/images/newapi/image-1.png)

### 2. Configure NewAPI in AstrBot

Open **Settings → Models & API → Chat Completion** in the AstrBot WebUI and click **Add**.

NewAPI fully supports OpenAI Chat Completion and Responses APIs, so select `OpenAI Compatible` (Chat Completion) or `OpenAI Responses` and open its provider settings.

Set `API Base URL` to your NewAPI endpoint:

- Self-hosted NewAPI example: `http://localhost:3000/v1`
- Hosted service example: `https://api.example.com/v1`

Enter the name, API key, and Base URL, then enter a **Model** ID directly or use **Fetch Models / Save and Fetch Models** near the field to fetch a list. Choose a **Chat configuration profile** and click **Save and use** to save the connection, add the model, and apply it. Leave **Save model without switching** selected to only save the connection and model. Connectivity tests and model settings remain in the configured-model list below. See [Connecting Model Services](./start.md) for details.

### 3. Apply the Provider

Open **Config**, select the profile to use, and go to **AI → Model**. Set **Chat Model** to the model you just added, then click **Save Configuration** at the bottom right. This setting is for AstrBot built-in AI.

You have now successfully configured NewAPI as an AstrBot model provider.
