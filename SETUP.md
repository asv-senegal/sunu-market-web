# Setting up the website on N0C with `git clone` and the terminal

This guide installs **sunu-market-web** on PlanetHoster **N0C** by cloning it from GitHub in the terminal, in the folder `sunumarketweb`. It is the alternative to the automatic FTP deployment in `DEPLOYMENT.md`: use one method or the other, not both.

- **Set up once:** steps 1 to 8.
- **Every update:** push from your computer, then run one command on the server (step 9).

The site renders its pages on the server, so it runs as a **Node.js application** that needs a **build**. Deploy the API first (repository `sunu-market-api`, its own `SETUP.md`): the website calls it for every page.

Examples used below: replace them with your own values.

| What | Example |
|---|---|
| Website address | `https://votredomaine.com` |
| API address | `https://api.votredomaine.com` |
| GitHub repository | `<your-account>/sunu-market-web` |
| Folder on N0C | `~/sunumarketweb` |
| Node.js version | `22` |

---

## Already tried and it does not start? The usual causes

| # | Cause | Why it breaks | Fix |
|---|---|---|---|
| 1 | **No build** | `build/` is excluded from Git, so a clone has no build and `server.cjs` has nothing to start. | `npm run build` (step 7 does it). |
| 2 | **Packages missing or incomplete** | The build needs the development packages (Vite, React Router tools). `npm install --omit=dev`, or `NODE_ENV=production` set in the terminal, skips them. | `npm install --include=dev`, then build. |
| 3 | **Wrong Node** | Without activating the app's Node environment, the terminal uses the server's default Node, often older than 22. | Activate the environment first (step 6). |
| 4 | **`node_modules` is a real folder** | On N0C it must be a link to the Node environment. Running `npm install` before creating the Node.js app creates a real folder. | `rm -rf node_modules`, activate the environment, install again. |
| 5 | **No `.env` or wrong `API_URL`** | The site cannot reach the API. | Step 5. |
| 6 | **App settings** | Startup file not `server.cjs`, or the application root is not `sunumarketweb`. | Step 4. |

**To see the real error**, start the site by hand in the terminal (after step 6). If it fails, the error is printed:

```bash
PORT=3999 timeout 30 node server.cjs & sleep 12; curl -sI http://127.0.0.1:3999/ | head -1; wait
```

`HTTP/1.1 200 OK` means the site works, and the problem is in the N0C app settings (cause 6) or the restart. Any error message points to one of causes 1 to 5.

---

## 1. Before you start

- The code is on GitHub (a private repository is fine).
- You can open a **terminal** on the server: N0C → **Advanced → Terminal**, or SSH from your computer.
- The domain `votredomaine.com` points to your N0C account, with an **SSL certificate** active (N0C → **Domains → SSL/TLS**). HTTPS is required: sign-in cookies and the app install pop-up only work over HTTPS.
- The API is online (`https://api.votredomaine.com/health` shows `{"ok":true}`).

## 2. Give the server read access to GitHub (deploy key)

A **deploy key** lets the server download this one repository, read-only. GitHub accepts a given deploy key on only **one** repository, so the API uses its own key.

In the terminal:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
ssh-keygen -t ed25519 -N "" -C "n0c-sunumarketweb" -f ~/.ssh/sunumarketweb_github
cat ~/.ssh/sunumarketweb_github.pub
```

Copy the line shown (it starts with `ssh-ed25519`). On GitHub, open the repository → **Settings → Deploy keys → Add deploy key**, paste it, give it a title (for example `N0C`), leave **Allow write access** unchecked, and save.

Then tell the server which key to use for this repository. GitHub's port 443 works even where port 22 is blocked:

```bash
cat >> ~/.ssh/config <<'EOF'

Host github-sunumarketweb
  HostName ssh.github.com
  Port 443
  User git
  IdentityFile ~/.ssh/sunumarketweb_github
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
ssh -T github-sunumarketweb
```

Answer `yes` to the first-connection question. The last command must say **"You've successfully authenticated"** (it also says GitHub does not provide shell access, which is normal).

## 3. Get the code into `~/sunumarketweb`

**If `~/sunumarketweb` does not exist yet:**

```bash
git clone github-sunumarketweb:<your-account>/sunu-market-web.git ~/sunumarketweb
```

**If the folder already exists** (created by N0C or by an earlier upload), `git clone` refuses a non-empty folder. Attach the existing folder to GitHub instead:

```bash
cd ~/sunumarketweb
git init -b main
git remote add origin github-sunumarketweb:<your-account>/sunu-market-web.git
git fetch origin
git reset --hard origin/main
git branch --set-upstream-to=origin/main main
```

`git reset --hard` replaces the repository's files with the GitHub version; files that are not in the repository (`.env`, `tmp/`) are kept.

Then check for an old `node_modules` folder (cause 4):

```bash
ls -ld ~/sunumarketweb/node_modules
```

If the line starts with `d` (a real folder), delete it: `rm -rf ~/sunumarketweb/node_modules`. If it starts with `l` (a link) or the folder does not exist, all is fine.

## 4. Create or check the Node.js application

N0C → **Languages → Node.js**. Create the application, or edit it if it already exists:

| Field | Value |
|---|---|
| Node.js version | **22** (or the highest available ≥ 22) |
| Application mode | **Production** |
| Application root | `sunumarketweb` |
| Application URL | `votredomaine.com` |
| Application startup file | `server.cjs` |

Save. The application page shows the command to **enter the virtual environment** (step 6).

## 5. Create the `.env` file

```bash
cd ~/sunumarketweb
cp .env.example .env
nano .env
```

Set these values (save with Ctrl+O, Enter, then quit with Ctrl+X):

```ini
NODE_ENV=production
API_URL=https://api.votredomaine.com
SESSION_SECRET=
```

For `SESSION_SECRET`, paste a random value generated by:

```bash
openssl rand -hex 32
```

Remove the `PORT=` line if `.env.example` added one: N0C chooses the port.

## 6. Activate the application's Node environment

Do this **every time** you open the terminal to work on the site: it selects Node 22 and the app's packages.

```bash
source ~/nodevenv/sunumarketweb/22/bin/activate && cd ~/sunumarketweb
node -v
```

`node -v` must show `v22` or higher. (Use the exact command shown on the app page in N0C if it differs.)

## 7. Install, build and start

```bash
bash scripts/server-update.sh
```

The script checks Node, `node_modules` and `.env`, then:

1. installs all packages, including the build tools;
2. builds the site (`npm run build`), creating `build/`;
3. touches `tmp/restart.txt`, which makes N0C restart the app.

It takes a few minutes the first time and stops with a clear message if something is missing.

## 8. Check

Open `https://votredomaine.com`. The logo screen appears, then the home page with the catalogue categories. The first visit after a restart is slower: the app is starting.

If you see an error page, run the manual start command from the top of this guide to see the real error.

## 9. Updating the site later

1. On your computer: commit and push to `main`.
2. On the server:

   ```bash
   source ~/nodevenv/sunumarketweb/22/bin/activate && cd ~/sunumarketweb && bash scripts/server-update.sh
   ```

The script pulls the new code, installs packages if needed, rebuilds and restarts.

> **About the GitHub workflow:** with this method, do not add FTP secrets to the repository. Without them, the workflow in `.github/workflows/deploy.yml` only builds the site on GitHub as a check and uploads nothing. Delete the file if you prefer.

## Troubleshooting

| Message or symptom | Cause | Fix |
|---|---|---|
| `Permission denied (publickey)` on `git clone` or `git pull` | Deploy key not added, or added to the other repository | Step 2: add `sunumarketweb_github.pub` to **this** repository's deploy keys. |
| `ssh: connect to host … port 22` | Port 22 blocked | Use the `github-sunumarketweb` alias from step 2 (port 443), not `git@github.com:`. |
| `destination path … already exists` | Folder exists | Use the "folder already exists" commands in step 3. |
| Script stops: "node introuvable" or "il faut Node 22" | Environment not activated | Step 6. |
| Script stops: "node_modules est un vrai dossier" | Cause 4 | `rm -rf node_modules`, then step 6 and the script again. |
| `vite: not found` or `react-router: not found` during the build | Build tools not installed | Run `bash scripts/server-update.sh` (it uses `--include=dev`); check `NODE_ENV` is not set to `production` in the terminal (`unset NODE_ENV`). |
| `Cannot find module …/build/server/index.js` | No build | Step 7. |
| Build stops with `Killed` or "JavaScript heap out of memory" | Not enough memory on the account for the build | Retry once; otherwise use the automatic FTP deployment in `DEPLOYMENT.md`, which builds on GitHub instead. |
| Pages show an error, the API is fine | Wrong `API_URL` | Check `.env` (step 5), then run the script again. |
| Sign-in does not stay signed in | Site opened over `http://` | Use `https://`; turn on HTTPS redirection in N0C. |
| Old version after an update | App not restarted | `touch ~/sunumarketweb/tmp/restart.txt`, or **Restart** in N0C. |
