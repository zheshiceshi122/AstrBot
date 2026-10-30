# Connecting Model Services

AstrBot supports the native API formats of OpenAI, Google GenAI, and Anthropic. You can connect any model service provider that conforms to one of these three API formats.

> [!NOTE]
> If you are located in mainland China, we strongly recommend using **official model providers** or compliant providers that follow local laws and regulations, for example:
>
> - [MoonshotAI](https://moonshot.cn/)
> - [GLM](https://bigmodel.cn/)
> - [MiniMax](https://www.minimax.io/)
> - [Qwen](https://qwen.ai/apiplatform)
> - [DeepSeek](https://deepseek.com/)
>
> These providers support the OpenAI API format. You can find the API Base URL and API Key from their documentation and fill them into AstrBot provider settings.
>
> Please note that using non-compliant third-party model services may introduce availability, privacy, or legal risks. For details, see the [EULA](https://github.com/AstrBotDevs/AstrBot/blob/master/EULA.md).

For example, you may choose to connect model services provided by (but not limited to):

- Official OpenAI model services ([OpenAI](https://openai.com/))
- Official Anthropic model services ([Anthropic](https://www.anthropic.com/))
- Google's Gemini model services via Google Cloud ([Google Cloud](https://cloud.google.com/))
- OpenRouter model services ([OpenRouter](https://openrouter.ai/))

## Integration Steps Using DeepSeek as an Example

Using DeepSeek as an example, assuming you have registered and logged in to a DeepSeek account, the steps to connect are:

1. Go to the DeepSeek Console (https://platform.deepseek.com/).
2. Click the "API Keys" menu in the left sidebar, create a new API Key, and copy the key.
3. Click the "API Documentation" link near the bottom of the left sidebar to open the API documentation page.
4. On the API documentation page, find the section about the "OpenAI-compatible interface" and note the API Base URL, for example `https://api.deepseek.com/v1`. (If there is no `/v1`, please add `/v1`.)
5. Open **Settings → Models & API → Chat Completion**, click **Add**, and select `DeepSeek`. For other OpenAI-compatible services, select `OpenAI Compatible`. Enter the provider name, `API Key`, and `API Base URL`.
6. Enter a model ID, such as `deepseek-chat`, directly in **Model** on the same form. Alternatively, use **Fetch Models / Save and Fetch Models** near **Model** to fetch the list (connection changes are saved first), then search or select a model.
7. Choose a **Chat configuration profile** and click **Save and use**. This saves the connection, adds the model, and applies it to that profile. Session-specific model overrides stay in effect.
8. To save without switching, leave **Save model without switching** selected and click **Save API and model**. With no model entered, **Save Configuration** only saves the connection.
9. Use the configured-model list below to test connectivity or edit model capabilities and context limits. Proxy and timeout settings remain under **Advanced Configuration**. Profiles using third-party agents are not automatically switched to AstrBot built-in AI.

Expand **Setup help** for input guidance and profile scope details.


The former **Custom Model → model settings dialog** flow is now the inline **Model** field. **Config → AI → Model → Chat Model** is still available; **Chat configuration profile → Save and use** provides the same selection on this page.


## Using Environment Variables to Load Keys

> Introduced in v4.13.0.

You can use environment variables to load provider API keys. In the provider configuration page, set the API Key field to `$ENV_VARIABLE_NAME`, for example: `$DEEPSEEK_API_KEY`.
