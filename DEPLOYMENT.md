# Deploying the website to PlanetHoster N0C with GitHub Actions

This guide puts **sunu-market-web** online on a PlanetHoster **N0C** account, in the folder `sunumarketweb`. After the one-time setup, every push to the `main` branch builds and deploys the site automatically, using **FTP only**.

> Deploy the **API first** (`sunu-market-api`, see its own guide): the website calls it for every page.

The site renders its pages on the server (React Router), so unlike a static site it runs as a **Node.js application**, like the API. The browser only talks to the website; the website calls the API from the server.

The domain names below are examples: replace `votredomaine.com` with your domain everywhere.

| What | Example |
|---|---|
| Website address | `https://votredomaine.com` |
| API address | `https://api.votredomaine.com` |
| Folder on N0C | `/home/<n0c-user>/sunumarketweb` |

## How the automatic deployment works

When you push to `main`, GitHub Actions:

1. **Checks and builds** the site (`npm run typecheck`, `npm run build`). If either fails, nothing is sent.
2. **Uploads the build by FTP** to `sunumarketweb` (only the files that changed; never `.env` or `node_modules`), with a new `tmp/restart.txt`.
3. **Restarts by itself**: N0C runs Node.js apps with Phusion Passenger, which restarts the app when `tmp/restart.txt` changes.
4. **Checks** that `https://votredomaine.com/` answers (if you set `HEALTH_URL`).

So a normal push needs nothing from you.

### When you still click a button: new packages

FTP copies files but cannot run programs. The packages the site depends on (`node_modules`) live in N0C's Node environment and have to be installed by N0C itself, only:

- on the **very first deployment**, and
- when **`package.json` changes**.

In those cases the GitHub run shows a yellow warning, and you click **Run NPM Install** then **Restart** in N0C → **Languages → Node.js**.

### Optional: SSH for fully hands-free deployments

With SSH (same key as the API), the workflow installs packages by itself when `package.json` changes. FTP only copies files; SSH can run commands such as `npm install`.

N0C menu names below are those of the English interface; the French interface uses the same structure (for example "Langages" for "Languages").

---

## 1. Prepare the domain

1. Make sure `votredomaine.com` points to your N0C account (N0C → **Domains**).
2. Activate an **SSL certificate** (N0C → **Domains → SSL/TLS**, Let's Encrypt). HTTPS is required: the session cookie is only sent over HTTPS in production, and the app install pop-up (PWA) needs HTTPS.
3. If the domain's `public_html` holds an old site, back it up: once the Node.js application is attached to the domain, it answers all requests.

## 2. Create the Node.js application

N0C → **Languages → Node.js → Create application**:

| Field | Value |
|---|---|
| Node.js version | **22** (or the highest available ≥ 22) |
| Application mode | **Production** |
| Application root | `sunumarketweb` |
| Application URL | `votredomaine.com` |
| Application startup file | `server.cjs` |

> Never upload a `node_modules` folder yourself: on N0C it is a link to the Node environment, and a real folder stops the app from starting.

## 3. Create the `.env` file on the server

With N0C's **File Manager**, create `/home/<n0c-user>/sunumarketweb/.env`. It is never in GitHub and the deployment never touches it.

```ini
NODE_ENV=production
# Adresse publique de l'API (dépôt sunu-market-api)
API_URL=https://api.votredomaine.com
# 64 caractères aléatoires, différents de ceux de l'API et du développement
SESSION_SECRET=
```

Generate `SESSION_SECRET` with:

```bash
openssl rand -hex 32
```

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Changing `SESSION_SECRET` later signs everyone out.

## 4. Push the code to GitHub

Create an **empty private repository** on GitHub (for example `sunu-market-web`), then from the `sunu-market-web` folder:

```bash
git init
git add .
git commit -m "Site Sunu-Market"
git branch -M main
git remote add origin https://github.com/<your-account>/sunu-market-web.git
git push -u origin main
```

Check that `git status` does **not** list `.env` before the first push. This first run builds the site and warns that nothing was sent until the FTP secrets exist.

## 5. FTP access (and optional SSH)

Use the **same FTP account** as the API (API guide, step 6), and the same SSH key if you set one up (API guide, step 7). Nothing new to create in N0C.

- FTP account with its home at your account root: keep the default `FTP_DIR` (`sunumarketweb/`).
- FTP account limited to `sunumarketweb`: set `FTP_DIR` to `./`.

## 6. GitHub secrets and variables

In the **sunu-market-web** repository: **Settings → Secrets and variables → Actions**. Secrets belong to one repository, so add them here too.

**Secrets**:

| Name | Value | Required |
|---|---|---|
| `FTP_SERVER` | FTP server | yes |
| `FTP_USERNAME` | FTP username | yes |
| `FTP_PASSWORD` | FTP password | yes |
| `SSH_HOST` | SSH host | only for SSH |
| `SSH_USERNAME` | your N0C username | only for SSH |
| `SSH_PRIVATE_KEY` | full content of the private key, including the `BEGIN` and `END` lines | only for SSH |

**Variables**:

| Name | Default | Set it when |
|---|---|---|
| `HEALTH_URL` | *(none)* | **recommended**: `https://votredomaine.com/`, so each run checks the site is up |
| `APP_DIR` | `sunumarketweb` | another application root |
| `FTP_DIR` | `sunumarketweb/` | FTP account limited to the app folder (`./`) |
| `FTP_PROTOCOL` | `ftps` | your server only accepts plain `ftp` |
| `NODE_VERSION` | `22` | another Node version chosen in step 2 |
| `SSH_PORT` | `5022` | N0C shows another SSH port |

## 7. First deployment

1. GitHub → **Actions → Mise en ligne du site → Run workflow** (or push to `main`). The first upload takes a few minutes.
2. In N0C → **Languages → Node.js** → your app: click **Run NPM Install**, then **Restart**. (Skip this if you set up SSH.)
3. Open `https://votredomaine.com`:
   - the logo screen appears, then the home page with the catalogue categories;
   - sign in with the administrator created in the API guide;
   - in Chrome on Android, the app install pop-up appears.

From now on, every push to `main` deploys by itself.

## Day to day

| Task | How |
|---|---|
| Deploy | Push to `main`. |
| Yellow warning "package.json a peut-être changé" | N0C → Node.js → **Run NPM Install**, then **Restart** (not needed with SSH). |
| Deploy again without changes | GitHub → Actions → **Run workflow**. |
| Undo a bad deployment | `git revert <commit>` then push. |
| Change `API_URL` or `SESSION_SECRET` | Edit `.env` on the server, then **Restart**. |
| See errors | N0C → Node.js → your app → log, and the GitHub Actions run. |

Visitors who installed the app get the new version on their next visit: the app always loads pages from the network.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Run fails at "typecheck" or "build" | Code error | Run `npm run typecheck` and `npm run build` locally, fix, push. |
| FTP step cannot connect | Protocol or server | Try `FTP_PROTOCOL` = `ftp`; check the server name. |
| Health check fails after a push | New packages not installed, or no restart | Click **Run NPM Install** then **Restart** in N0C, then **Re-run jobs** in GitHub. |
| Login or any form shows "500 Un Problème Est Survenu", and the browser shows `POST …/connexion.data` with **400 Bad Request** | Old `server.cjs`: behind the N0C proxy the site saw `http` while the browser used `https`, and React Router refused every form | Update the code (`bash scripts/server-update.sh`, or push for the FTP method). The current `server.cjs` reads the proxy headers. If it still happens, the site log shows `[origine] formulaire refusé : Origin=…, adresse vue=…`. |
| Login or a form shows "Le service est momentanément indisponible" | The website cannot reach the API | Check `API_URL` in `.env` (the API address only, without `/api` or `/health`), then from the server run `curl -s <API_URL>/health`. The website log shows `[API injoignable] <address> : <cause>` (for example `ECONNREFUSED`, `ENOTFOUND`, a certificate error). |
| Every page shows an error, the API log is quiet | Wrong `API_URL` | Check `.env`, and that `https://api.votredomaine.com/health` answers. |
| Sign-in works, then you are signed out at once | Site opened over `http://` | Use `https://` and turn on HTTPS redirection in N0C. |
| App error mentioning `node_modules` and a symlink | A real `node_modules` folder exists | Delete `~/sunumarketweb/node_modules`, then **Run NPM Install**. |
| Old version still showing after a push | Passenger did not pick up `tmp/restart.txt`, or browser cache | Reload once; if it persists, click **Restart** in N0C and let us know. |
| First page after a quiet period is slow | Passenger was asleep | Normal. |
