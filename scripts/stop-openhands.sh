#!/bin/bash
# Stop OpenHands
# Usage: ./scripts/stop-openhands.sh

CONTAINER_NAME="openhands-app"

echo "==> Stopping OpenHands container..."
podman stop "$CONTAINER_NAME" 2>/dev/null && echo "   Container stopped" || echo "   Container not running"

echo "==> Stopping Podman API service..."
pkill -f "podman system service" 2>/dev/null && echo "   Service stopped" || echo "   Service not running"

echo "==> Done"
