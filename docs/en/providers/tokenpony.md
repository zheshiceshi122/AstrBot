# Connecting to TokenPony

## Configuring the Chat Model

Register and log in to [TokenPony](https://www.tokenpony.cn/3YPyf).

Navigate to the TokenPony [API Keys](https://www.tokenpony.cn/#/user/keys) page and create a new API Key. Save it for later use.

Visit the TokenPony [Models page](https://www.tokenpony.cn/#/model) to select your desired model. Note down the model name for later use.

In the AstrBot WebUI, open **Settings → Models & API → Chat Completion**, click **Add**, and select `TokenPony`.

Enter the name, API key, and Base URL, then enter a **Model** ID directly or use **Fetch Models / Save and Fetch Models** near the field to fetch a list. Choose a **Chat configuration profile** and click **Save and use** to save the connection, add the model, and apply it. Leave **Save model without switching** selected to only save the connection and model. Connectivity tests and model settings remain in the configured-model list below. See [Connecting Model Services](./start.md) for details.

## Applying the Chat Model

Open **Config**, select the profile to use, and go to **AI → Model**. Set **Chat Model** to the model you just added, then click **Save Configuration** at the bottom right. This setting is for AstrBot built-in AI.
