#!/usr/bin/env bash
#
# Humi appliance installer.
#
#   curl -sfL https://cloud.humi.kaese.space/static-files/appliance/installation/install-appliance.sh | sudo bash
#
# Turns a fresh Linux machine into a Humi appliance:
#   1. k3s (single-node Kubernetes, with its bundled Traefik and network
#      policy controller, which the Humi manifests rely on)
#   2. ArgoCD, which then manages itself from huemie-gitops-base
#   3. the "argocd" and "humi" ArgoCD Applications from
#      huemie-gitops-base/appliance/application/
#
# Safe to re-run: every step either skips work that is already done or
# re-applies the same desired state. Re-running is also how changes to
# appliance/application/ reach an existing appliance.
#
# Overridable via environment:
#   K3S_VERSION    k3s release to install
#   GITOPS_RAW     raw-file base URL of huemie-gitops-base at the tracked revision

set -euo pipefail

K3S_VERSION="${K3S_VERSION:-v1.36.5+k3s1}"
GITOPS_RAW="${GITOPS_RAW:-https://raw.githubusercontent.com/Kaese72/huemie-gitops-base/master}"

APPLICATIONS=(argocd humi)

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

kubectl() { k3s kubectl "$@"; }

preflight() {
	[ "$(id -u)" -eq 0 ] || fail "must run as root (pipe into 'sudo bash')"
	[ "$(uname -s)" = "Linux" ] || fail "only Linux is supported"
	[ -d /run/systemd/system ] || fail "systemd is required"
	command -v curl >/dev/null || fail "curl is required"
	curl -sfI "$GITOPS_RAW/appliance/argocd/kustomization.yaml" >/dev/null \
		|| fail "cannot reach $GITOPS_RAW"
}

install_k3s() {
	if command -v k3s >/dev/null && k3s --version | grep -qF "$K3S_VERSION"; then
		log "k3s $K3S_VERSION already installed"
	else
		log "installing k3s $K3S_VERSION"
		curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="$K3S_VERSION" sh -
	fi

	log "waiting for the Kubernetes node to become ready"
	local i
	for i in $(seq 1 60); do
		kubectl get nodes 2>/dev/null | grep -q . && break
		sleep 5
	done
	kubectl wait --for=condition=Ready node --all --timeout=300s >/dev/null
}

install_argocd() {
	# Once the argocd Application exists, ArgoCD owns its own version
	# (appliance/argocd in gitops); applying the bootstrap manifest again
	# would only fight it.
	if kubectl -n argocd get application.argoproj.io argocd >/dev/null 2>&1; then
		log "ArgoCD already self-managed, skipping bootstrap"
		return
	fi

	# Same manifest the argocd Application will reconcile to, so the
	# hand-over is a no-op.
	local manifest
	manifest="$(curl -sfL "$GITOPS_RAW/appliance/argocd/kustomization.yaml" \
		| grep -oE 'https://raw\.githubusercontent\.com/argoproj/argo-cd/[^[:space:]]+/manifests/install\.yaml' \
		| head -n1)"
	[ -n "$manifest" ] || fail "no ArgoCD install.yaml URL found in appliance/argocd/kustomization.yaml"

	log "installing ArgoCD from $manifest"
	kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f - >/dev/null
	curl -sfL "$manifest" | kubectl apply --server-side --force-conflicts -n argocd -f - >/dev/null

	log "waiting for ArgoCD to become ready"
	kubectl wait --for=condition=Established crd/applications.argoproj.io --timeout=120s >/dev/null
	kubectl -n argocd rollout status statefulset/argocd-application-controller --timeout=600s
	kubectl -n argocd rollout status deployment/argocd-repo-server --timeout=600s
	kubectl -n argocd rollout status deployment/argocd-server --timeout=600s
}

apply_applications() {
	local app
	for app in "${APPLICATIONS[@]}"; do
		log "applying Application $app"
		curl -sfL "$GITOPS_RAW/appliance/application/$app.yaml" | kubectl apply -f -
	done
}

main() {
	preflight
	install_k3s
	install_argocd
	apply_applications

	local ip
	ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
	log "done. ArgoCD is now syncing Humi; this takes a few minutes on first install."
	echo "    progress:  sudo k3s kubectl -n argocd get applications"
	echo "    Humi UI:   https://${ip:-<this machine>}/"
}

# Wrapped in main so a truncated download never runs half a script.
main "$@"
