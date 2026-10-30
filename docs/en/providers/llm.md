# Large Language Model Providers

In the WebUI, open **Settings → Models & API → Chat Completion**, click **Add**, and select a provider type. For an OpenAI-compatible service, select `OpenAI Compatible` and enter the API Base URL and API key supplied by that service.

Enter the name, API key, and Base URL. Enter or select a **Model** on the same form, choose a **Chat configuration profile**, and click **Save and use**. Model creation and profile selection no longer require separate dialogs or leaving this page.

Leave **Save model without switching** selected to only save the connection and model. Advanced connection settings stay collapsed. Model capabilities, context limits, and connectivity tests remain available in the configured-model list. **Config → AI → Model → Chat Model** is still available.

See [Connecting Model Services](./start.md) for detailed steps.

> Provider connection settings are stored in `provider_sources` in `data/cmd_config.json`; individual model configurations are stored in `provider`.
