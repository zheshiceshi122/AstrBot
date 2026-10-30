# 使用 Termux 在 Android 部署 AstrBot

本方案在 Android 的 Termux 中运行 AstrBot，并通过 Cloudflare Tunnel 和 Access 让 iPhone 浏览器安全访问 AstrBot 自带的管理面板。无需单独拆出静态网页，也无需在手机上开放入站端口。

AstrBot 需要 Python 3.12 或更高版本。为减少 Android/Bionic 与原生 Python 二进制依赖的兼容问题，下面在 Termux 的 Ubuntu `proot` 环境中运行 AstrBot。Android 机型、芯片和依赖轮子不同，安装结果可能不同；本方案没有在实体 Android 设备上实测。

## 1. 安装 Termux 环境

从 [Termux 官方发布页](https://github.com/termux/termux-app/releases) 或 F-Droid 安装 Termux。不要混装不同来源的 Termux 与插件应用。

在 Termux 中执行：

```sh
pkg update && pkg upgrade
pkg install git proot-distro termux-services cloudflared
proot-distro install ubuntu
```

安装 [`termux-services`](https://github.com/termux/termux-services) 后，完全退出并重新打开 Termux 一次，让服务管理器启动。

## 2. 在 Ubuntu proot 中安装 AstrBot

```sh
proot-distro login ubuntu
apt update
apt install -y ca-certificates curl git build-essential pkg-config libffi-dev libssl-dev libsqlite3-dev zlib1g-dev libjpeg-dev ffmpeg
curl -LsSf https://astral.sh/uv/install.sh | sh
source "$HOME/.local/bin/env"
uv python install 3.12
cd /root
git clone https://github.com/AstrBotDevs/AstrBot.git
cd /root/AstrBot
uv sync --python 3.12
uv run main.py
```

首次启动后按提示完成初始化，再按 `Ctrl+C` 停止前台进程。默认管理面板端口为 `6185`。之后可按需更新仓库并重新执行 `uv sync`。

如果 `uv sync` 在 Android ARM64 上因某个原生依赖缺少兼容构建而失败，该依赖可能需要另行编译或替换；此时不要继续执行服务安装。

## 3. 电脑二改后同步到 Termux

Termux 里最初克隆的官方仓库不会自动包含电脑上的修改。先在 GitHub 创建你自己的仓库（建议私有），把电脑上的修改提交并推送到该仓库。然后在 Termux 的 Ubuntu proot 中切换到你的仓库和分支：

```sh
sv down astrbot
proot-distro login ubuntu
cd /root/AstrBot
git remote set-url origin https://github.com/<你的账号>/<你的AstrBot仓库>.git
git fetch origin
git switch --track -c <你的分支> origin/<你的分支>
uv sync --python 3.12
exit
sv up astrbot
```

以后电脑端推送了新修改后，在 Termux 拉取并重启服务：

```sh
sv down astrbot
proot-distro login ubuntu
cd /root/AstrBot
git pull --ff-only
uv sync --python 3.12
exit
sv up astrbot
```

不要删除 `/root/AstrBot/data`；它保存 AstrBot 的配置和运行数据。你也可以在电脑上先合入 AstrBot 官方更新，再推送到自己的仓库，Termux 只需拉取自己的仓库。

## 4. 用 Termux 服务管理器维持 AstrBot

退出 Ubuntu proot，回到 Termux 主环境。把仓库中的服务安装脚本复制到 Termux 主环境后运行：

```sh
proot-distro login --user root ubuntu -- cat /root/AstrBot/scripts/termux/install-service.sh > "$HOME/install-astrbot-service.sh"
bash "$HOME/install-astrbot-service.sh" ubuntu /root/AstrBot
```

脚本会创建并启用 `astrbot` 服务。它以前台方式运行 AstrBot，由 Termux 的 `runit` 服务管理器监控；AstrBot 进程异常退出时会自动重启。

```sh
sv status astrbot
sv down astrbot
sv up astrbot
tail -f "$PREFIX/var/log/sv/astrbot/current"
```

只要 Android 没有终止 Termux 进程，服务管理器就会维持 AstrBot。若 Android 杀掉 Termux，服务会一起停止；下次打开 Termux 后，已启用的服务会随服务管理器启动。手机重启后自动启动 Termux 需要另行安装和配置 Termux:Boot。

请在 Android 系统设置中将 Termux 电池用量设为“不受限制”，并避免手动从最近任务中强行停止 Termux。系统厂商仍可能基于内存、电量或网络策略结束进程。

## 5. 通过 Cloudflare 让 iPhone 访问管理面板

按 [Cloudflare 私有 Web 应用指南](https://developers.cloudflare.com/cloudflare-one/setup/secure-private-apps/private-web-app/) 在 Zero Trust 中创建 Tunnel，并添加一个公开主机名，源服务设为 `http://localhost:6185`。同一主机名上创建 Access 应用，只允许你的邮箱通过一次性验证码登录，并将 **Session Duration** 设为 **1 week**。如果对应 Access policy 单独设了 Session Duration，也将它设为一周。不要在没有 Access 保护的情况下公开 AstrBot 管理面板。

[Termux 的 cloudflared 包](https://github.com/termux/termux-packages/blob/master/packages/cloudflared/sv/cloudflared.run.in)提供了 `termux-services` 服务定义。将 Cloudflare 控制台生成的 Tunnel token 保存到 Termux 主环境的 `~/.cloudflared/token`，然后启用服务：

```sh
mkdir -p "$HOME/.cloudflared"
chmod 700 "$HOME/.cloudflared"
umask 077
# 用编辑器把 Tunnel token 写入这个文件，不要把 token 发给别人或提交到 Git。
nano "$HOME/.cloudflared/token"
chmod 600 "$HOME/.cloudflared/token"
sv-enable cloudflared
sv status cloudflared
```

在 iPhone Safari 打开 Tunnel 配置的 HTTPS 主机名，通过 Cloudflare Access 验证后，再用 AstrBot 自己的账号登录，即可使用原版管理面板配置。AstrBot WebUI 的 API 请求与页面保持同源，由 Tunnel 一起转发。

AstrBot 管理面板的登录 Cookie 与 JWT 有效期均为 30 天。Cloudflare Access 会话按上面设置为一周，因此通常每周重新验证邮箱一次，AstrBot 账号不需要每天重新登录。

QQ 接入建议先使用 AstrBot 的 [QQ 官方 Bot（WebSocket）](https://docs.astrbot.app/platform/qqofficial/websockets.html)适配器。若使用 OneBot/NapCat，NapCat 需要连到 AstrBot 的反向 WebSocket 监听端口；这种连接方式不应直接暴露给公网，宜让两者处于同一设备或私有网络。

## 常见问题

- iPhone 页面可以打开但无法操作：先检查 Access 登录是否完成、Tunnel 是否在线，以及 AstrBot 服务状态。
- Termux 重新打开后面板离线：运行 `sv status astrbot` 和 `sv status cloudflared`；若服务管理器未运行，重新打开一个 Termux 会话。
- AstrBot 能打开但 QQ 不在线：检查 AstrBot 平台适配器连接日志，以及 Android 是否切换网络或被系统限制后台联网。
- Tunnel token 泄露：在 Cloudflare 控制台轮换 token，并更新本地文件。
