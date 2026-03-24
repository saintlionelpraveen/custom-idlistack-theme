# Ghost CMS — Dual Log Pipeline Deployment Guide

Complete production deployment using **Minikube**:
- **Pipeline 1**: Active logs → Promtail → Loki → Grafana (Minikube)
- **Pipeline 2**: Archive logs → inotifywait → gzip → rclone → Google Drive (systemd)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MINIKUBE CLUSTER                              │
│                                                                 │
│  ┌───────────┐    ┌──────────┐    ┌───────────────────────┐     │
│  │ Promtail  │───▶│   Loki   │◀───│ Grafana (:30300)      │     │
│  │ DaemonSet │    │ (v2.9.4) │    │ (v10.4.2)             │     │
│  └─────┬─────┘    └──────────┘    │ Auto-provisioned      │     │
│        │                          │ - Loki datasource     │     │
│        │                          │ - Ghost Logs dashboard│     │
│  ┌─────┴──────────┐              └───────────────────────┘     │
│  │ /mnt/ghost-logs │ ◀── minikube mount                        │
│  │   /active/*.log │                                            │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
         ▲
         │ minikube mount
         │
┌────────┴────────────────────────────────────────────────────────┐
│                      HOST MACHINE                               │
│                                                                 │
│  ~/ghost/log_rotating/                                          │
│  ├── active/   ──▶ Promtail reads these (Pipeline 1)            │
│  └── archive/  ──▶ inotifywait + rclone to Google Drive         │
│                    (Pipeline 2 — systemd service)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### 1. Install Minikube

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64
minikube version
```

### 2. Install kubectl

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/kubectl
rm kubectl
kubectl version --client
```

### 3. Install inotify-tools & rclone

```bash
sudo apt-get update && sudo apt-get install -y inotify-tools rclone
```

---

## Section 1: rclone Google Drive Setup

### Step 1: Create rclone remote

```bash
rclone config
```

| Prompt | Answer |
|---|---|
| `n/s/q>` | `n` (new remote) |
| `name>` | `gdrive` |
| `Storage>` | `drive` (or type the number for Google Drive) |
| `client_id>` | Leave blank (press Enter) |
| `client_secret>` | Leave blank (press Enter) |
| `scope>` | `1` (Full access) |
| `root_folder_id>` | Leave blank |
| `service_account_file>` | Leave blank |
| `Edit advanced config?` | `n` |
| `Use auto config?` | `y` (opens browser for OAuth) |
| `Configure as team drive?` | `n` |
| `y/e/d>` | `y` (confirm) |
| `e/n/d/r/c/s/q>` | `q` (quit) |

### Step 2: Create folder structure in Google Drive

```bash
rclone mkdir gdrive:ghost-logs/archive
```

### Step 3: Test connection

```bash
rclone lsd gdrive:
rclone lsd gdrive:ghost-logs/
echo "test upload $(date)" > /tmp/test-upload.txt
rclone copy /tmp/test-upload.txt gdrive:ghost-logs/archive/
rclone ls gdrive:ghost-logs/archive/
rm /tmp/test-upload.txt
```

---

## Section 2: Deploy Monitoring Stack (Minikube)

### Option A: One-Click Deploy Script (Recommended)

```bash
cd /home/praveen/ghost/monitoring
bash deploy-minikube.sh
```

The script will:
1. ✅ Check prerequisites (minikube, kubectl)
2. ✅ Start Minikube if not running
3. ✅ Set up `minikube mount` for host log directory
4. ✅ Apply all K8s manifests (namespace → Loki → Promtail → Grafana)
5. ✅ Wait for all pods to become Ready
6. ✅ Print access URLs

### Option B: Manual Step-by-Step

```bash
# 1. Start Minikube
minikube start --driver=docker --memory=4096 --cpus=2

# 2. Mount host log directory into Minikube VM
minikube mount /home/praveen/ghost/log_rotating:/mnt/ghost-logs &

# 3. Apply manifests in order
kubectl apply -f monitoring/k8s/namespace.yaml
kubectl apply -f monitoring/k8s/loki-configmap.yaml
kubectl apply -f monitoring/k8s/loki-deployment.yaml
kubectl apply -f monitoring/k8s/promtail-deployment.yaml
kubectl apply -f monitoring/k8s/grafana-deployment.yaml

# 4. Wait for pods
kubectl get pods -n log-rotating -w

# 5. Verify
kubectl get all -n log-rotating
```

### Step 3: Verify all pods are running

```bash
kubectl get pods -n log-rotating
```

Expected output:
```
NAME                       READY   STATUS    RESTARTS   AGE
grafana-xxxxx              1/1     Running   0          60s
loki-xxxxx                 1/1     Running   0          60s
promtail-xxxxx             1/1     Running   0          60s
```

---

## Section 3: Deploy Archive Watcher Service

### Step 1: Install systemd service

```bash
sudo cp /home/praveen/ghost/monitoring/ghost-archive-watcher.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ghost-archive-watcher
sudo systemctl status ghost-archive-watcher
```

### Step 2: View watcher logs

```bash
tail -f /home/praveen/ghost/log_rotating/watcher.log
```

---

## Section 4: Run 100MB Stress Test

```bash
cd /home/praveen/ghost/monitoring
node stress-test.js
```

This generates **100MB** of logs (700,000 lines) with mixed levels (info/warn/error). Winston rotates files at **34MB** each, keeping **3 active files** and archiving overflow.

### What to expect during stress test:
1. Active directory fills with 3 × 34MB log files
2. Oldest files rotate to archive directory
3. Promtail ships active logs to Loki in real-time
4. Archive watcher detects, compresses, and uploads archive files to Google Drive

---

## Section 5: End-to-End Verification

### Test 1: Active Logs → Loki (Minikube)

```bash
# Port-forward Loki
kubectl port-forward -n log-rotating svc/loki 3100:3100 &

# Write a test log
echo '{"timestamp":"2026-03-24T12:00:00Z","level":"info","message":"E2E minikube pipeline test"}' \
  >> /home/praveen/ghost/log_rotating/active/test.log

# Wait and query
sleep 10
curl -s 'http://localhost:3100/loki/api/v1/query_range' \
  --data-urlencode 'query={job="ghost",log_type="active"}' \
  --data-urlencode 'limit=5' | python3 -m json.tool
```

### Test 2: Grafana UI

```bash
# Open Grafana in browser
minikube service grafana -n log-rotating
```

- **Login**: `admin` / `admin`
- **Dashboard**: Navigate to Dashboards → Ghost → "Ghost CMS Logs" (auto-provisioned)
- **Explore**: Select Loki datasource → Query: `{job="ghost", log_type="active"}`

### Test 3: Archive Logs → Google Drive

```bash
# Create a test archive file
echo '{"timestamp":"2026-03-24T12:00:00Z","level":"info","message":"Archive test"}' \
  > /home/praveen/ghost/log_rotating/archive/test-archive.log

# Watch watcher process it
tail -f /home/praveen/ghost/log_rotating/watcher.log

# After ~10 seconds, verify on Google Drive
rclone ls gdrive:ghost-logs/archive/
```

### Test 4: Full 100MB Stress Verification

```bash
# Run stress test
cd /home/praveen/ghost/monitoring && node stress-test.js

# Check active (should have 3 files, ~34MB each)
ls -lh /home/praveen/ghost/log_rotating/active/

# Check archives uploaded to Google Drive
rclone ls gdrive:ghost-logs/archive/
rclone size gdrive:ghost-logs/archive/
```

---

## Section 6: Troubleshooting

| # | Symptom | Cause | Fix |
|---|---------|-------|-----|
| 1 | Pods stuck in `Pending` | PVC not bound | Check storage: `kubectl get pvc -n log-rotating`. Minikube has default StorageClass |
| 2 | Promtail `CrashLoopBackOff` | Mount path missing or Loki unreachable | Verify mount: `minikube ssh -- ls /mnt/ghost-logs/active`. Check Loki: `kubectl logs -n log-rotating -l app=loki` |
| 3 | No logs in Grafana | Promtail not scraping | Check targets: `kubectl port-forward -n log-rotating daemonset/promtail 3101:3101` then `curl localhost:3101/targets` |
| 4 | `minikube mount` dies | Process killed or terminal closed | Restart: `minikube mount /home/praveen/ghost/log_rotating:/mnt/ghost-logs &`. Use `deploy-minikube.sh` to auto-restart |
| 5 | Loki `rate limit exceeded` | Stress test too fast | Already tuned: 40MB/s ingestion rate. If still hitting, increase `ingestion_rate_mb` in `loki-configmap.yaml` |
| 6 | rclone upload fails | OAuth expired | Re-auth: `rclone config reconnect gdrive:`. Test: `rclone lsd gdrive:` |
| 7 | Watcher not detecting files | inotifywait not running | Check: `systemctl status ghost-archive-watcher`. Restart: `sudo systemctl restart ghost-archive-watcher` |

---

## Section 7: Management Commands

```bash
# --- Minikube ---
minikube status                                    # Cluster status
minikube dashboard                                 # Open K8s dashboard
minikube stop                                      # Stop cluster (preserves data)
minikube delete                                    # Delete cluster completely

# --- Monitoring Stack ---
kubectl get all -n log-rotating                    # All resources
kubectl logs -n log-rotating -l app=loki -f        # Loki logs
kubectl logs -n log-rotating -l app=promtail -f    # Promtail logs
kubectl logs -n log-rotating -l app=grafana -f     # Grafana logs

# --- Port Forwarding ---
kubectl port-forward -n log-rotating svc/loki 3100:3100      # Loki API
kubectl port-forward -n log-rotating svc/grafana 3000:3000   # Grafana UI

# --- Minikube Mount ---
cat /tmp/minikube-mount.pid                        # Mount process PID
tail -f /tmp/minikube-mount.log                    # Mount logs

# --- Archive Watcher ---
sudo systemctl restart ghost-archive-watcher       # Restart watcher
journalctl -u ghost-archive-watcher --since today  # Today's logs
tail -50 /home/praveen/ghost/log_rotating/watcher.log

# --- rclone ---
rclone ls gdrive:ghost-logs/archive/               # List uploaded archives
rclone size gdrive:ghost-logs/archive/              # Total size on Drive

# --- Redeploy after config changes ---
kubectl delete -f monitoring/k8s/ 2>/dev/null
bash monitoring/deploy-minikube.sh
```

---

## Summary Table

| Pipeline | Source | Tool | Destination | Trigger |
|----------|--------|------|-------------|---------|
| Pipeline 1 — Active | `log_rotating/active/*.log` | Promtail (Minikube DaemonSet) | Loki → Grafana (Minikube) | Continuous tail |
| Pipeline 2 — Archive | `log_rotating/archive/*` | inotifywait + gzip + rclone (systemd) | Google Drive `ghost-logs/archive/` | File creation event |

### Production Specs

| Component | Version | Resources | Storage |
|-----------|---------|-----------|---------|
| Loki | 2.9.4 | 512Mi–1Gi RAM, 200m–1000m CPU | 10Gi PVC |
| Promtail | 2.9.4 | 64Mi–256Mi RAM, 50m–200m CPU | — |
| Grafana | 10.4.2 | 128Mi–256Mi RAM, 100m–300m CPU | 2Gi PVC |
| Winston | — | maxSize: 34MB, maxFiles: 3 | 100MB active cap |
| Stress Test | — | 700,000 lines ≈ 100MB | — |
