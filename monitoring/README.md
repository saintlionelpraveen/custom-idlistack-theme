# Ghost CMS — Log Rotation & Monitoring: Complete Workflow Reference

> A human-friendly guide to every file, every service, and every command in this project.

---

## 1. The Big Picture

This project has **two separate pipelines** that handle your Ghost CMS logs:

```
                        ┌──────────────────────────────────────────────────────────┐
                        │               YOUR GHOST APPLICATION                      │
                        │         (writes logs via Winston logger)                  │
                        └───────────────┬──────────────────────────────────────────┘
                                        │
                                        ▼
                    ┌──────────────────────────────────────────┐
                    │       log_rotating/ (on your machine)     │
                    │                                          │
                    │   ┌──────────────┐                       │
                    │   │   active/    │                       │
                    │   │  (Log files) │                       │
                    │   └──────┬───────┘                       │
                    └──────────┼───────────────────────────────┘
                               │                   │
                    ───────────┼───────────────────┼──────────────
                               │                   │
                     PIPELINE 1│          PIPELINE 2│
                    (Real-time)│          (Archival) │
                               │                   │
                               ▼                   ▼
                  ┌─────────────────┐   ┌────────────────────┐
                  │    Promtail     │   │  Archive Watcher   │
                  │  (reads active  │   │  (polls active     │
                  │   logs, sends   │   │   dir for excess   │
                  │   to Loki)      │   │   rotated logs)    │
                  └────────┬────────┘   └────────┬───────────┘
                           │                     │
                           ▼                     ▼
                  ┌─────────────────┐   ┌────────────────────┐
                  │      Loki       │   │   gzip + rclone    │
                  │  (stores logs   │   │  (compress & upload │
                  │   for 7 days)   │   │   to Google Drive)  │
                  └────────┬────────┘   └────────┬───────────┘
                           │                     │
                           ▼                     ▼
                  ┌─────────────────┐   ┌────────────────────┐
                  │    Grafana      │   │   Google Drive      │
                  │  (dashboard     │   │  ghost-logs/        │
                  │   to view logs) │   │    archive/         │
                  └─────────────────┘   └────────────────────┘
```

### In Simple Words

| Pipeline | What it does | Where logs end up | How you check it |
|----------|-------------|-------------------|-----------------|
| **Pipeline 1 — Active** | Ships your latest logs to Loki in real-time so you can search and view them in Grafana | **Loki + Grafana** (inside Minikube) | Open Grafana in your browser |
| **Pipeline 2 — Archive** | Watches for excess active log files (>3), compresses them with gzip, and uploads them to your Google Drive before safely deleting them. | **Google Drive** (`ghost-logs/archive/`) | Open Google Drive in your browser |

---

## 2. The Log Rotation Rules

Winston (the Node.js logger) follows these strict rules:

| Rule | Value | What it means |
|------|-------|--------------|
| Max file size | **20 MB** | When a log file reaches 20 MB, Winston creates a new file |
| Max active files | **10** (fallback) | Winston keeps up to 10 files just in case the watcher is completely offline. Usually, the watcher keeps it at 3. |
| Target active capacity| **~60 MB** | 3 files × 20 MB = 60 MB maintained by the background watcher |
| Archive handling | **Safe Polling** | The systemd watcher checks active/ every 10s → compresses oldest files → uploads → deletes local copy ONLY on success |

### The Life of a Log Line

```
  1. Ghost app writes a log        →  active/log-2026-03-24.log
  2. File reaches 20 MB            →  Winston creates a new file (log.2, log.3...)
  3. More than 3 files in active/  →  Watcher detects excess logs
  4. Watcher processes excess      →  Compresses to .gz → Uploads to Google Drive → Deletes from active/
```

---

## 3. File-by-File Reference

### Directory Structure

```
ghost/
├── log_rotating/                          ← Log storage on your machine
│   ├── active/                            ← All log files (Promtail reads the latest 3)
│   │   ├── log-2026-03-24.log.3           ← Active log file (~20MB)
│   │   ├── log-2026-03-24.log.4           ← Active log file (~20MB)
│   │   └── log-2026-03-24.log.5           ← Active log file (currently writing)
│   └── watcher.log                        ← The watcher's own log
│
└── monitoring/                            ← All configuration lives here
    ├── custom-logger.js                   ← The Winston logger
    ├── stress-test.js                     ← Generates 100MB test logs
    ├── deploy-minikube.sh                 ← One-click deploy script
    ├── ghost-archive-watcher.sh           ← Archive pipeline bash script
    ├── ghost-archive-watcher.service      ← systemd service unit
    ├── docker-compose.yml                 ← OLD Docker Compose setup (not used anymore)
    ├── loki-config.yml                    ← OLD standalone Loki config (not used anymore)
    ├── promtail-config.yml                ← OLD standalone Promtail config (not used anymore)
    ├── promtail-values.yaml               ← OLD Helm values (not used anymore)
    ├── DEPLOY.md                          ← Step-by-step deployment guide
    ├── README.md                          ← Project overview
    │
    └── k8s/                               ← Kubernetes manifests (ACTIVE — used by Minikube)
        ├── namespace.yaml                 ← Creates the "log-rotating" namespace
        ├── loki-configmap.yaml            ← Loki server configuration
        ├── loki-deployment.yaml           ← Loki Deployment + PVC + Service
        ├── promtail-deployment.yaml       ← Promtail ConfigMap + DaemonSet
        └── grafana-deployment.yaml        ← Grafana Deployment + Datasource + Dashboard + Service
```

### File Purposes

#### Application Files (Winston Logger)

| File | Purpose |
|------|---------|
| **`custom-logger.js`** | The heart of log generation. This is a Winston logger configured with `DailyRotateFile` transport. It writes JSON log lines to `active/`, rotates at 20MB. Every log line includes a timestamp, level, and message in JSON format so Promtail can parse it. |
| **`stress-test.js`** | A test script that generates **100MB** (~700,000 lines) of fake log data. It writes a mix of `info` (normal), `warn` (memory alerts), and `error` (database failures) to simulate realistic production traffic. Used to verify the entire pipeline works under load. |

#### Archive Pipeline Files (systemd + bash)

| File | Purpose |
|------|---------|
| **`ghost-archive-watcher.sh`** | A bash script that runs continuously in the background polling `active/`. When the log count exceeds 3, it safely: (1) compresses the oldest logs with `gzip` to a temporary directory, (2) uploads the `.gz` file to Google Drive using `rclone`, and (3) ONLY IF upload is successful does it delete the original log from the active directory. If upload fails, the log remains safe in `active/` to be retried next time. |
| **`ghost-archive-watcher.service`** | A systemd unit file that runs the watcher script as a background service. It ensures the watcher starts on boot, restarts automatically on failure (with a 5-second delay), and routes all output to `watcher.log`. It runs as the `praveen` user because rclone's OAuth token is stored in that user's config. |

#### Kubernetes Manifests (Minikube — Pipeline 1)

| File | Purpose |
|------|---------|
| **`k8s/namespace.yaml`** | Creates the `log-rotating` namespace. This isolates all logging components from other Kubernetes workloads so they don't interfere with each other. |
| **`k8s/loki-configmap.yaml`** | The Loki server configuration, stored as a Kubernetes ConfigMap. It defines: filesystem-based chunk storage, 7-day log retention with automatic compaction, ingestion rate limits (40MB/s) tuned for the 100MB stress test, and Write-Ahead Logging (WAL) for crash recovery. |
| **`k8s/loki-deployment.yaml`** | Deploys Loki as a single-replica Deployment with a 10GB PersistentVolumeClaim for durable storage, health checks (readiness + liveness probes on `/ready`), and resource limits (512MB–1GB RAM). Also creates a ClusterIP Service so Promtail and Grafana can reach Loki at `loki:3100` inside the cluster. |
| **`k8s/promtail-deployment.yaml`** | Two resources in one file: (1) A ConfigMap with Promtail's scrape configuration — it reads `*.log` files from the mounted active directory, parses the Winston JSON format (extracting timestamp, level, message), and pushes to Loki with 1MB batches. (2) A DaemonSet that runs Promtail on every node (just one node in Minikube). It mounts the host's log directory via `minikube mount` at `/mnt/ghost-logs/active`. |
| **`k8s/grafana-deployment.yaml`** | The most complex manifest. It contains: a 2GB PersistentVolumeClaim for dashboard persistence, a ConfigMap that auto-provisions Loki as the default datasource (so you never have to add it manually), a ConfigMap with a pre-built "Ghost CMS Logs" dashboard, a Deployment running Grafana v10.4.2 with resource limits, and a NodePort Service on port 30300 for browser access via `minikube service`. |

#### Deployment & Documentation Files

| File | Purpose |
|------|---------|
| **`deploy-minikube.sh`** | One-click deployment script. Checks prerequisites, starts Minikube if needed, sets up the `minikube mount` background process, applies all manifests in the correct order, waits for every pod to become Ready, and prints access URLs. This is the recommended way to deploy. |
| **`DEPLOY.md`** | The comprehensive step-by-step deployment guide. Covers everything from installing Minikube and kubectl, to configuring rclone for Google Drive, to running the stress test and verifying both pipelines. |

#### Legacy Files (No Longer Used)

| File | Why it exists | Status |
|------|--------------|--------|
| `docker-compose.yml` | Original Docker Compose setup before Minikube migration | **Deprecated** — kept for reference |
| `loki-config.yml` | Standalone Loki config for Docker Compose | **Deprecated** — replaced by `k8s/loki-configmap.yaml` |
| `promtail-config.yml` | Standalone Promtail config for Docker Compose | **Deprecated** — replaced by `k8s/promtail-deployment.yaml` |
| `promtail-values.yaml` | Helm chart values for K3s setup | **Deprecated** — replaced by `k8s/promtail-deployment.yaml` |

---

## 4. Commands Reference

### 🟢 Starting Everything

| What | Command | Notes |
|------|---------|-------|
| **Start everything at once** | `cd /home/praveen/ghost/monitoring && bash deploy-minikube.sh` | Recommended. Starts Minikube, sets up mount, deploys all pods |
| Start Minikube only | `minikube start --driver=docker --memory=4096 --cpus=2` | Use if you just need the cluster running |
| Start the log directory mount | `minikube mount /home/praveen/ghost/log_rotating:/mnt/ghost-logs &` | **Must** be running for Promtail to see your logs |
| Deploy K8s manifests | `kubectl apply -f monitoring/k8s/` | Applies all manifests at once |
| Start archive watcher | `sudo systemctl start ghost-archive-watcher` | Starts the Google Drive upload service |
| Enable watcher on boot | `sudo systemctl enable ghost-archive-watcher` | Makes the watcher start automatically after reboot |

### 👀 Viewing & Monitoring

| What | Command | Notes |
|------|---------|-------|
| **Open Grafana dashboard** | `minikube service grafana -n log-rotating` | Opens your browser automatically |
| Check all pod statuses | `kubectl get pods -n log-rotating` | All should show `1/1 Running` |
| Check all resources | `kubectl get all -n log-rotating` | Shows pods, services, deployments, daemonsets |
| View Loki logs | `kubectl logs -n log-rotating -l app=loki -f` | Live-tail Loki's own output |
| View Promtail logs | `kubectl logs -n log-rotating -l app=promtail -f` | Check if it's scraping files |
| View Grafana logs | `kubectl logs -n log-rotating -l app=grafana -f` | |
| Query Loki via API | `kubectl port-forward -n log-rotating svc/loki 3100:3100` then `curl 'http://localhost:3100/loki/api/v1/query_range' --data-urlencode 'query={job="ghost"}'` | Direct Loki API access |
| Check Promtail targets | `kubectl port-forward -n log-rotating daemonset/promtail 3101:3101` then `curl http://localhost:3101/targets` | Shows which files Promtail is tailing |
| View active log files | `ls -lh /home/praveen/ghost/log_rotating/active/` | See file sizes and timestamps |
| View archive log files | `ls -lh /home/praveen/ghost/log_rotating/archive/` | Files here are waiting for upload |
| View watcher log | `tail -f /home/praveen/ghost/log_rotating/watcher.log` | Live-tail the archive watcher output |
| Check watcher service | `sudo systemctl status ghost-archive-watcher` | systemd service status |
| View uploaded files | `rclone ls gdrive:ghost-logs/archive/` | List all files on Google Drive |
| Check Drive storage used | `rclone size gdrive:ghost-logs/archive/` | Total size of uploaded archives |
| Check Minikube status | `minikube status` | Shows if cluster is running |
| Open K8s dashboard | `minikube dashboard` | Visual Kubernetes management UI |

### 🔧 Stress Testing

| What | Command | Notes |
|------|---------|-------|
| Run 100MB stress test | `cd /home/praveen/ghost/monitoring && node stress-test.js` | Generates 700,000 log lines |
| Watch files during test | `watch -n1 'ls -lh /home/praveen/ghost/log_rotating/active/'` | See files grow in real-time |

### 🔴 Stopping Everything

| What | Command | Notes |
|------|---------|-------|
| Stop archive watcher | `sudo systemctl stop ghost-archive-watcher` | Stops the Google Drive upload service |
| Delete all K8s resources | `kubectl delete -f monitoring/k8s/` | Removes all pods, services, PVCs |
| Stop Minikube (keep data) | `minikube stop` | Cluster stops but all data is preserved |
| Delete Minikube completely | `minikube delete` | Destroys cluster and all data |
| Kill minikube mount | `kill $(cat /tmp/minikube-mount.pid)` | Stops the background mount process |

### 🔄 Restarting & Redeploying

| What | Command | Notes |
|------|---------|-------|
| Restart a specific pod | `kubectl rollout restart deployment/loki -n log-rotating` | Replace `loki` with `grafana` as needed |
| Restart Promtail | `kubectl rollout restart daemonset/promtail -n log-rotating` | |
| Restart archive watcher | `sudo systemctl restart ghost-archive-watcher` | |
| Full redeploy | `kubectl delete -f monitoring/k8s/ && bash deploy-minikube.sh` | Nuclear option — fresh deploy |

---

## 5. How Data Flows Step-by-Step

### Pipeline 1: Active Logs → Grafana (Real-time Viewing)

```
Step 1:  Ghost app calls logger.info("some message")
              │
Step 2:  Winston writes JSON to → active/log-2026-03-24.log
              │                    {"timestamp":"...","level":"info","message":"some message"}
              │
Step 3:  minikube mount maps → active/ folder is visible inside Minikube VM
              │                 at /mnt/ghost-logs/active/
              │
Step 4:  Promtail (DaemonSet) tails → /var/log/ghost/active/*.log
              │                        (mounted from /mnt/ghost-logs/active/)
              │
Step 5:  Promtail parses JSON → extracts timestamp, level, message
              │                  adds labels: job=ghost, log_type=active
              │
Step 6:  Promtail pushes → HTTP POST to Loki at loki:3100/loki/api/v1/push
              │
Step 7:  Loki stores → chunks on 10GB persistent disk, indexed by time
              │          kept for 7 days, then auto-deleted by compactor
              │
Step 8:  You open Grafana → query {job="ghost"} → see your logs!
```

### Pipeline 2: Archive Logs → Google Drive (Long-term Storage)

```
Step 1:  active/ accumulates more than 3 rotated log files
              │
Step 2:  Watcher detects excess logs → picks the oldest file (e.g., log1.0.log)
              │
Step 3:  gzip compresses → /tmp/log1.0.log.gz
              │
Step 4:  rclone uploads → gdrive:ghost-logs/archive/log1.0.log.gz
              │               (3 retries, 60s timeout)
              │
Step 5:  Upload SUCCESS → Watcher deletes active/log1.0.log and the temp .gz
              │
Step 6:  You check Google Drive → see the compressed archive files!
```

---

## 6. How to View Your Logs

### Viewing Active Logs in Grafana/Loki
1. Ensure Grafana is open by running: `minikube service grafana -n log-rotating`
2. Go to the **Explore** tab (compass icon on the left sidebar).
3. Select **Loki** from the top data source dropdown.
4. Click the **Label Browser** or use the query builder.
5. You should now see labels like `job` and `log_type` (e.g., Select `job` = `ghost`, `log_type` = `active`).
6. Click **Run query** to see your live, real-time active logs streaming exactly from your rotating files.

### Viewing Archived Logs in Google Drive
1. The archive watcher uploads older logs (beyond the first 3 active ones) to Google Drive.
2. To verify locally via command line, simply run:
   ```bash
   rclone ls gdrive:ghost-logs/archive/
   ```
3. Alternatively, open your Google Drive in a web browser, navigate to the **ghost-logs > archive** folder, and you will see your `.log.gz` compressed archive files safely stored.

---

## 7. Quick Health Check

Run these three commands to know if everything is healthy:

```bash
# 1. Are all pods running?
kubectl get pods -n log-rotating
# Expected: 3 pods, all "1/1 Running"

# 2. Is the archive watcher running?
sudo systemctl status ghost-archive-watcher
# Expected: "active (running)"

# 3. Is the minikube mount alive?
minikube ssh -- ls /mnt/ghost-logs/active/
# Expected: shows your log files
```

If all three pass, your entire logging system is healthy. ✅
