# 接入 NewAPI

[New API](http://newapi.ai/) 是一个新一代大模型网关与 AI 资产管理系统，基于 One API 进行二次开发。该项目旨在提供一个统一的接口来管理和使用各种 AI 模型服务，包括但不限于 OpenAI、Anthropic、Gemini 和 Midjourney 等。

AstrBot 支持接入 NewAPI 作为模型提供商，用户可以通过 NewAPI 来访问和使用各种 AI 模型服务。

## 配置步骤

### 获取 NewAPI API Key 密钥

在 NewAPI 注册并登录后，点击上方导航栏的「控制台」，点击「令牌管理」，然后点击「添加令牌」按钮，创建一个新的 API Key 密钥，选择适当的权限，然后点击「创建」。

![create-api-key](https://files.astrbot.app/docs/source/images/newapi/image.png)

创建成功后，点击复制密钥按钮，复制生成的 API Key 密钥。

![copy-api-key](https://files.astrbot.app/docs/source/images/newapi/image-1.png)
### 在 AstrBot 中配置 NewAPI 服务提供商

打开 AstrBot 管理面板，进入「设置」→「模型与 API」→「对话」，点击「新增」。

NewAPI 完美地支持了 OpenAI Chat Completion 和 Responses 接口，选择 `OpenAI Compatible`（Chat Completion）或 `OpenAI Responses`，进入相应的提供商设置。

在弹出的对话框中，将 API Base URL 设置为 NewAPI 的接口地址。如果您本地部署了 NewAPI，则填写本地地址，例如 `http://localhost:3000/v1`，如果您使用第三方服务商提供的 NewAPI 服务，则填写相应的 URL 地址，例如 `https://api.example.com/v1`。

填写名称、API Key 和 Base URL，在同页「模型」中直接输入模型 ID，或点击模型附近的「获取模型列表 / 保存并获取模型」按钮获取列表。选择「用于聊天的配置文件」，点击「保存并使用」即可完成连接、模型添加和应用；保留「仅保存模型，暂不切换」则只保存连接和模型。保存后可在下方已配置模型列表中测试连通性或编辑模型参数。详细操作见 [接入模型服务](./start.md)。

### 应用服务提供商

进入「配置文件」，选择要使用的配置文件，在「AI」→「模型」中将「对话模型」设为刚添加的模型，点击右下角「保存配置」。此项用于 AstrBot 内置 AI。

至此，您已经成功配置了 NewAPI 作为 AstrBot 的模型提供商。现在，您可以通过 AstrBot 来访问和使用 NewAPI 提供的各种 AI 模型服务了。
