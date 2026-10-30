# 接入模型服务

AstrBot 适配了 OpenAI、Google GenAI、Anthropic 三种原生 API 格式。您可以接入任意符合这三种 API 格式之一的模型服务提供商。

> [!NOTE]
> 如果您位于中国大陆境内，我们强烈建议您使用符合当地法律法规的由**模型厂商官方提供的**或经过备案的模型服务提供商，例如：
> 
> - [MoonshotAI](https://moonshot.cn/)
> - [GLM](https://bigmodel.cn/)
> - [MiniMax](https://www.minimax.io/)
> - [Qwen](https://qwen.ai/apiplatform)
> - [DeepSeek](https://deepseek.com/)
>
> 上述提供商均支持 OpenAI API 格式，您可以通过其文档中有关 “OpenAI 格式接入” 的说明，找到 API Base URL 及 API Key，然后将其填入 AstrBot 的提供商配置中。
> 
> 请注意，使用未经备案的第三方模型服务提供商可能会导致服务不可用、信息泄露或其他法律风险，请谨慎选择。更多内容，请阅读我们的最终用户许可协议（[EULA](https://github.com/AstrBotDevs/AstrBot/blob/master/EULA.md)）。

例如，您可以选择接入如下（但不限于）模型提供商提供的模型服务：

- OpenAI 官方提供的模型服务（[OpenAI 官方网站](https://openai.com/)）
- Anthropic 官方提供的模型服务（[Anthropic 官方网站](https://www.anthropic.com/)）
- Google 提供的 Gemini 模型服务（[Google Cloud 官方网站](https://cloud.google.com/)）
- OpenRouter 提供的模型服务（[OpenRouter 官方网站](https://openrouter.ai/)）

## 以 DeepSeek 为例的接入步骤

以 DeepSeek 为例，假设您已经注册并登录了 DeepSeek 账户，接入步骤如下：

- 进入 [DeepSeek 控制台](https://platform.deepseek.com/)。
- 点击左侧导航栏的 “API Keys” 菜单，创建一个新的 API Key，并复制该 Key。
- 点击左侧导航栏下方的 “接口文档” 链接，进入 API 文档页面。
- 在 API 文档页面中，找到 “OpenAI 兼容接口” 相关的内容，记下 API Base URL，例如 `https://api.deepseek.com/v1`。（如果没有 /v1，就请加上 /v1）。
- 打开「设置」→「模型与 API」→「对话」，点击「新增」，选择 `DeepSeek`。其他兼容 OpenAI API 的服务可选择 `OpenAI Compatible`。填写提供商名称、`API Key` 和 `API Base URL`。
- 在同一张表单的「模型」中直接输入模型 ID，例如 `deepseek-chat`。也可以点击模型附近的「获取模型列表 / 保存并获取模型」按钮获取列表（连接有修改时会先保存），再搜索、选择模型。
- 在「用于聊天的配置文件」中选择目标配置文件，点击「保存并使用」，即可一起保存 API、添加模型并应用到该配置文件。已有会话单独指定的模型仍保持原设置。
- 如果暂时只想保存模型，保留「仅保存模型，暂不切换」，点击「保存 API 和模型」。未填写模型时，按钮为「保存配置」，只保存连接信息。
- 保存后，在下方「已配置的模型」中测试连通性或编辑模型能力、上下文长度等参数；代理、超时等连接参数位于折叠的「高级配置」。使用第三方 Agent 的配置文件不会被自动切换为 AstrBot 内置 AI。

填写方式、配置文件作用范围等说明默认收在「填写说明」中，点击展开即可查看。


原来的「自定义模型 → 模型参数弹窗」已合并到表单中的「模型」输入框。原来的「配置文件 → AI → 模型 → 对话模型」仍保留，也可以直接通过本页「用于聊天的配置文件 → 保存并使用」完成选择。


## 使用环境变量加载 Key

> v4.13.0 之后引入

支持使用环境变量加载模型服务提供商的 API Key。在提供商配置页面，将 API Key 一栏填写为 `$环境变量名称` 的名称即可，例如填写 `$DEEPSEEK_API_KEY`。
