# 接入胜算云

[胜算云](https://www.shengsuanyun.com/?from=CH_T70U2X9L) 提供兼容 OpenAI 等格式的统一模型接口，可通过一个 API Key 接入多种主流模型。

## 获取 API Key

1. 前往 [胜算云](https://www.shengsuanyun.com/?from=CH_T70U2X9L) 注册并登录账号。
2. 进入控制台，创建并复制 API Key。

## 在 AstrBot 中配置

打开 AstrBot 管理面板，进入 **模型提供商 → 对话 → 新增 → OpenAI Compatible**，填写以下信息：

| 配置项 | 值 |
| --- | --- |
| 提供商名称 | `胜算云` |
| API Base URL | `https://router.shengsuanyun.com/api/v1` |
| API Key | 在胜算云控制台创建的 API Key |

填写名称、API Key 和 Base URL，在同页「模型」中直接输入模型 ID，或点击模型附近的「获取模型列表 / 保存并获取模型」按钮获取列表。选择「用于聊天的配置文件」，点击「保存并使用」即可完成连接、模型添加和应用；保留「仅保存模型，暂不切换」则只保存连接和模型。保存后可在下方已配置模型列表中测试连通性或编辑模型参数。详细操作见 [接入模型服务](./start.md)。

## 设为默认模型

进入「配置文件」，选择要使用的配置文件，在「AI」→「模型」中将「对话模型」设为刚添加的模型，点击右下角「保存配置」。此项用于 AstrBot 内置 AI。
