# Deploy AstrBot on Android with Termux

This setup runs AstrBot in Termux on Android and uses Cloudflare Tunnel and Access to let an iPhone browser reach AstrBot's built-in dashboard. It does not split the dashboard into a separate static site or require an inbound port on the phone.

AstrBot requires Python 3.12 or newer. The steps below use an Ubuntu `proot` environment to reduce compatibility issues between Android/Bionic and native Python dependencies. Results can vary by Android device, CPU architecture, and available binary wheels. This setup has not been tested on a physical Android device.

## 1. Install Termux

Install Termux from the [official releases](https://github.com/termux/termux-app/releases) or F-Droid. Do not mix Termux and add-on apps from different sources.

Run in Termux:

```sh
pkg update && pkg upgrade
pkg install git proot-distro termux-services cloudflared
proot-distro install ubuntu
```

After installing [`termux-services`](https://github.com/termux/termux-services), fully close and reopen Termux once so its service manager starts.

## 2. Install AstrBot in Ubuntu proot

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

Complete the initial setup, then stop the foreground process with `Ctrl+C`. The dashboard uses port `6185` by default. Update the checkout and rerun `uv sync` when needed.

If `uv sync` fails because a native dependency has no compatible Android ARM64 build, that dependency may need to be built or replaced. Do not continue with service setup until dependency installation succeeds.

## 3. Sync your PC changes to Termux

The official repository cloned in Termux does not automatically include changes on your PC. First create a repository you own (a private repository is recommended), then commit and push your PC changes there. Switch the Termux checkout to that repository and branch from inside Ubuntu proot:

```sh
sv down astrbot
proot-distro login ubuntu
cd /root/AstrBot
git remote set-url origin https://github.com/<your-account>/<your-AstrBot-repository>.git
git fetch origin
git switch --track -c <your-branch> origin/<your-branch>
uv sync --python 3.12
exit
sv up astrbot
```

After pushing new changes from your PC, pull them on Termux and restart the service:

```sh
sv down astrbot
proot-distro login ubuntu
cd /root/AstrBot
git pull --ff-only
uv sync --python 3.12
exit
sv up astrbot
```

Do not delete `/root/AstrBot/data`; it contains AstrBot configuration and runtime data. You can merge upstream AstrBot updates on your PC before pushing them to your repository; Termux only needs to pull your repository.

## 4. Keep AstrBot supervised by Termux

Exit the Ubuntu proot and return to the Termux host environment. Copy the service installer from the checkout and run it:

```sh
proot-distro login --user root ubuntu -- cat /root/AstrBot/scripts/termux/install-service.sh > "$HOME/install-astrbot-service.sh"
bash "$HOME/install-astrbot-service.sh" ubuntu /root/AstrBot
```

The script creates and enables an `astrbot` service. It runs AstrBot in the foreground under Termux's `runit` service manager, which restarts AstrBot if its process exits unexpectedly.

```sh
sv status astrbot
sv down astrbot
sv up astrbot
tail -f "$PREFIX/var/log/sv/astrbot/current"
```

As long as Android has not terminated the Termux process, the service manager keeps AstrBot running. If Android kills Termux, its services stop too; enabled services start again when Termux and its service manager next start. To start Termux automatically after a device reboot, install and configure Termux:Boot separately.

Set Termux battery usage to **Unrestricted** in Android settings and avoid force-stopping it from the recent-apps screen. Device vendors may still terminate processes because of memory, battery, or network policies.

## 5. Let an iPhone reach the dashboard through Cloudflare

Follow the [Cloudflare private web application guide](https://developers.cloudflare.com/cloudflare-one/setup/secure-private-apps/private-web-app/) to create a Tunnel in Cloudflare Zero Trust and add a public hostname whose service is `http://localhost:6185`. Create an Access application for the same hostname, allow only your email to sign in with a one-time PIN, and set **Session Duration** to **1 week**. If the matching Access policy has its own Session Duration, set it to one week too. Do not publish the AstrBot dashboard without Access protection.

The [Termux package for `cloudflared`](https://github.com/termux/termux-packages/blob/master/packages/cloudflared/sv/cloudflared.run.in) includes a `termux-services` service definition. Save the Tunnel token generated in the Cloudflare dashboard to `~/.cloudflared/token` in the Termux host environment, then enable the service:

```sh
mkdir -p "$HOME/.cloudflared"
chmod 700 "$HOME/.cloudflared"
umask 077
# Use an editor to put the Tunnel token in this file. Do not share it or commit it to Git.
nano "$HOME/.cloudflared/token"
chmod 600 "$HOME/.cloudflared/token"
sv-enable cloudflared
sv status cloudflared
```

On iPhone Safari, open the HTTPS hostname configured for the Tunnel. After Cloudflare Access and AstrBot authentication, you can configure AstrBot through its original dashboard. Tunnel forwards the dashboard and its API requests on the same origin.

AstrBot's dashboard login cookie and JWT both last 30 days. With the Cloudflare Access session set to one week above, expect to re-authenticate your email about once a week; the AstrBot password should not be needed every day.

For QQ, start with AstrBot's [QQ Official Bot (WebSocket)](https://docs.astrbot.app/en/platform/qqofficial/websockets.html) adapter. If using OneBot/NapCat, NapCat must connect to AstrBot's reverse WebSocket listener; keep both on the same device or private network instead of exposing that listener publicly.

## Troubleshooting

- If the iPhone page opens but does not work, check Access authentication, Tunnel status, and AstrBot service status.
- If the dashboard is offline after reopening Termux, check `sv status astrbot` and `sv status cloudflared`. If the service manager is not running, open a new Termux session.
- If AstrBot is online but QQ is disconnected, check the platform adapter logs and whether Android changed networks or restricted background networking.
- If the Tunnel token is exposed, rotate it in Cloudflare and replace the local token file.
