#!/bin/bash
# Start OpenHands — autonomous coding agent with web dashboard
# Usage: ./scripts/start-openhands.sh

set -e

SOCKET_PATH="$HOME/.local/share/containers/podman.sock"
CONTAINER_NAME="openhands-app"
IMAGE="docker.openhands.dev/openhands/openhands:latest"

echo "==> Starting Podman API service..."
# Mata processo antigo se existir
pkill -f "podman system service" 2>/dev/null || true
sleep 1

# Inicia serviço persistente do Podman
nohup podman system service --time=0 unix://$SOCKET_PATH > /tmp/podman-service.log 2>&1 &
sleep 2

if [ ! -S "$SOCKET_PATH" ]; then
    echo "ERROR: Podman socket not created at $SOCKET_PATH"
    exit 1
fi
echo "   Podman socket OK"

echo "==> Starting OpenHands container..."
podman run -d --name "$CONTAINER_NAME" \
  --replace \
  -p 3000:3000 \
  -e DOCKER_HOST=unix:///var/run/docker.sock \
  -e LLM_API_KEY="${OPENHANDS_LLM_API_KEY:-sk-123456789}" \
  -e LLM_BASE_URL="${OPENHANDS_LLM_BASE_URL:-http://host.containers.internal:4000/v1}" \
  -e LLM_MODEL="${OPENHANDS_LLM_MODEL:-gpt-5.3-chat-latest}" \
  -e AGENT_SERVER_IMAGE_REPOSITORY=ghcr.io/openhands/agent-server \
  -e AGENT_SERVER_IMAGE_TAG=1.19.1-python \
  -e LOG_ALL_EVENTS=true \
  -e WORKSPACE_MOUNT_PATH=/opt/workspace_base \
  -e GITHUB_TOKEN="${OPENHANDS_GITHUB_TOKEN:-}" \
  -v "$SOCKET_PATH:/var/run/docker.sock" \
  -v openhands-state:/.openhands \
  -v "$PWD:/opt/workspace_base" \
  --add-host host.docker.internal:host-gateway \
  "$IMAGE"

echo ""
echo "==> OpenHands started!"
echo "    Dashboard: http://localhost:3000"
echo "    Workspace: $PWD"
echo ""
echo "    Logs:      podman logs -f $CONTAINER_NAME"
echo "    Stop:      ./scripts/stop-openhands.sh"
