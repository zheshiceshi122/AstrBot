# 接入 PPIO 派欧云

PPIO 派欧云是中国领先的独立分布式云计算服务商，您可以在派欧云上使用稳定、低价甚至免费的模型服务。

## 准备

打开 [PPIO 派欧云官网](https://ppio.cn/user/register?invited_by=AIOONE)，并注册账户（通过此链接注册的账户将会获得 15 元人民币的代金券）。

进入 [模型 API 服务](https://ppio.cn/model-api/console)，找到你想接入的模型。你可以通过筛选器选择不同厂商或者免费的模型。

![image](https://files.astrbot.app/docs/source/images/ppio/image-1.png)

找到你想要接入的模型后，点击模型卡片，侧边会展开一个模型详情卡片，找到下方的 API 接入指南，如果您还没创建过 Key 可以点击创建。

![image](https://files.astrbot.app/docs/source/images/ppio/image-3.png)

进入 AstrBot WebUI 的「设置」→「模型与 API」→「对话」，点击「新增」，选择 `PPIO`。

填写名称、API Key 和 Base URL，在同页「模型」中直接输入模型 ID，或点击模型附近的「获取模型列表 / 保存并获取模型」按钮获取列表。选择「用于聊天的配置文件」，点击「保存并使用」即可完成连接、模型添加和应用；保留「仅保存模型，暂不切换」则只保存连接和模型。保存后可在下方已配置模型列表中测试连通性或编辑模型参数。详细操作见 [接入模型服务](./start.md)。

## 使用

进入「配置文件」，选择要使用的配置文件，在「AI」→「模型」中将「对话模型」设为刚添加的模型，点击右下角「保存配置」。此项用于 AstrBot 内置 AI。

对机器人输入 `/provider` 指令，将提供商切换到刚刚添加的 PPIO 派欧云提供商，即可使用。

## 常见问题

#### 显示 `400` 错误

```log
Error code: 400 - {'code': 400, 'message': '"auto" tool choice requires --enable-auto-tool-choice and --tool-call-parser to be set', 'type': 'BadRequestError'}
```

请在 WebUI 中关闭所有调用工具后即可使用，或者换用其他模型。
