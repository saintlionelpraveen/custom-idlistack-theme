#!/usr/bin/env bash
# ============================================================
# Ghost Log Pipeline — Minikube Deployment Script
# One-click deploy: namespace → Loki → Promtail → Grafana
#
# Usage: bash deploy-minikube.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="${SCRIPT_DIR}/k8s"
LOG_DIR="/home/praveen/ghost/log_rotating"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# --- Step 0: Check prerequisites ---
check_prerequisites() {
    log_info "Checking prerequisites..."
    local missing=0

    for cmd in minikube kubectl; do
        if ! command -v "$cmd" &>/dev/null; then
            log_error "$cmd is not installed"
            missing=1
        else
            log_ok "$cmd found: $(command -v "$cmd")"
        fi
    done

    if [[ "$missing" -eq 1 ]]; then
        log_error "Install missing tools and try again."
        exit 1
    fi
}

# --- Step 1: Start Minikube ---
start_minikube() {
    local status
    status=$(minikube status --format='{{.Host}}' 2>/dev/null || echo "Stopped")

    if [[ "$status" == "Running" ]]; then
        log_ok "Minikube is already running"
    else
        log_info "Starting Minikube cluster..."
        minikube start --driver=docker --memory=4096 --cpus=2
        log_ok "Minikube cluster started"
    fi

    # Verify node
    kubectl get nodes
}

# --- Step 2: Set up minikube mount ---
setup_mount() {
    log_info "Setting up Minikube mount: ${LOG_DIR} → /mnt/ghost-logs"

    # Kill any existing mount process
    pkill -f "minikube mount.*ghost-logs" 2>/dev/null || true
    sleep 1

    # Ensure log directories exist on host
    mkdir -p "${LOG_DIR}/active" "${LOG_DIR}/archive"

    # Start mount in background
    nohup minikube mount "${LOG_DIR}:/mnt/ghost-logs" \
        --uid=0 --gid=0 \
        > /tmp/minikube-mount.log 2>&1 &

    local MOUNT_PID=$!
    echo "$MOUNT_PID" > /tmp/minikube-mount.pid
    sleep 3

    if kill -0 "$MOUNT_PID" 2>/dev/null; then
        log_ok "Minikube mount active (PID: $MOUNT_PID)"
    else
        log_error "Minikube mount failed! Check /tmp/minikube-mount.log"
        cat /tmp/minikube-mount.log
        exit 1
    fi
}

# --- Step 3: Apply K8s manifests ---
deploy_stack() {
    log_info "Deploying monitoring stack to Minikube..."

    # 1. Namespace
    log_info "Creating namespace..."
    kubectl apply -f "${K8S_DIR}/namespace.yaml"

    # 2. Loki ConfigMap + Deployment + Service
    log_info "Deploying Loki..."
    kubectl apply -f "${K8S_DIR}/loki-configmap.yaml"
    kubectl apply -f "${K8S_DIR}/loki-deployment.yaml"

    # 3. Promtail ConfigMap + DaemonSet
    log_info "Deploying Promtail..."
    kubectl apply -f "${K8S_DIR}/promtail-deployment.yaml"

    # 4. Grafana (PVC, ConfigMaps, Deployment, Service)
    log_info "Deploying Grafana..."
    kubectl apply -f "${K8S_DIR}/grafana-deployment.yaml"

    log_ok "All manifests applied"
}

# --- Step 4: Wait for pods ---
wait_for_pods() {
    log_info "Waiting for all pods to become Ready (timeout: 120s)..."

    # Wait for Loki
    kubectl rollout status deployment/loki -n log-rotating --timeout=120s || {
        log_error "Loki deployment timed out"
        kubectl describe deployment/loki -n log-rotating
        exit 1
    }
    log_ok "Loki is ready"

    # Wait for Grafana
    kubectl rollout status deployment/grafana -n log-rotating --timeout=120s || {
        log_error "Grafana deployment timed out"
        kubectl describe deployment/grafana -n log-rotating
        exit 1
    }
    log_ok "Grafana is ready"

    # Wait for Promtail DaemonSet
    kubectl rollout status daemonset/promtail -n log-rotating --timeout=120s || {
        log_error "Promtail DaemonSet timed out"
        kubectl describe daemonset/promtail -n log-rotating
        exit 1
    }
    log_ok "Promtail is ready"

    echo ""
    log_info "All pods:"
    kubectl get pods -n log-rotating -o wide
}

# --- Step 5: Print access info ---
print_access_info() {
    echo ""
    echo "============================================================"
    echo -e "${GREEN}  ✅ Ghost Log Pipeline — Deployed to Minikube!${NC}"
    echo "============================================================"
    echo ""
    echo -e "  ${CYAN}Grafana UI:${NC}"
    echo "    Run: minikube service grafana -n log-rotating"
    echo "    Login: admin / admin"
    echo ""
    echo -e "  ${CYAN}Loki API (via port-forward):${NC}"
    echo "    Run: kubectl port-forward -n log-rotating svc/loki 3100:3100"
    echo "    Test: curl http://localhost:3100/ready"
    echo ""
    echo -e "  ${CYAN}Promtail Targets:${NC}"
    echo "    Run: kubectl port-forward -n log-rotating daemonset/promtail 3101:3101"
    echo "    Test: curl http://localhost:3101/targets"
    echo ""
    echo -e "  ${CYAN}Stress Test (100MB):${NC}"
    echo "    Run: cd ${SCRIPT_DIR} && node stress-test.js"
    echo ""
    echo "============================================================"
}

# --- Main ---
main() {
    echo ""
    echo "============================================="
    echo "  Ghost Log Pipeline — Minikube Deployer"
    echo "============================================="
    echo ""

    check_prerequisites
    start_minikube
    setup_mount
    deploy_stack
    wait_for_pods
    print_access_info
}

main "$@"
