# 接入 TokenPony（小马算力）

## 配置对话模型

注册并登录小马算力 [TokenPony](https://www.tokenpony.cn/3YPyf) 。

在小马算力 [API Keys](https://www.tokenpony.cn/#/user/keys) 页面创建一个新的 API Key，留存备用。

在小马算力[模型页面](https://www.tokenpony.cn/#/model)选择需要使用的模型，留存模型名称备用。

进入 AstrBot WebUI 的「设置」→「模型与 API」→「对话」，点击「新增」，选择 `TokenPony`。

填写名称、API Key 和 Base URL，在同页「模型」中直接输入模型 ID，或点击模型附近的「获取模型列表 / 保存并获取模型」按钮获取列表。选择「用于聊天的配置文件」，点击「保存并使用」即可完成连接、模型添加和应用；保留「仅保存模型，暂不切换」则只保存连接和模型。保存后可在下方已配置模型列表中测试连通性或编辑模型参数。详细操作见 [接入模型服务](./start.md)。

## 应用对话模型

进入「配置文件」，选择要使用的配置文件，在「AI」→「模型」中将「对话模型」设为刚添加的模型，点击右下角「保存配置」。此项用于 AstrBot 内置 AI。
