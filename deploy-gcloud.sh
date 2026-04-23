#!/usr/bin/env bash
# One-shot deploy: enable APIs, build, push, deploy to Cloud Run.
# Pre-req: gcloud auth login, billing attached to project.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-logitrack-pwa}"
REGION="${REGION:-asia-southeast1}"
SERVICE="${SERVICE:-logitrack}"

echo "▶ Project: $PROJECT_ID · Region: $REGION · Service: $SERVICE"

gcloud config set project "$PROJECT_ID"

echo "▶ Enabling APIs (run once — idempotent)"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

if [[ -z "${MONGODB_URI:-}" ]]; then
  echo "⚠ MONGODB_URI env not set locally — skipping secret upload."
  echo "  Run:  echo -n 'mongodb+srv://…' | gcloud secrets create mongodb-uri --data-file=-"
else
  if gcloud secrets describe mongodb-uri >/dev/null 2>&1; then
    echo -n "$MONGODB_URI" | gcloud secrets versions add mongodb-uri --data-file=-
  else
    echo -n "$MONGODB_URI" | gcloud secrets create mongodb-uri --data-file=- --replication-policy=automatic
  fi
fi

echo "▶ Deploying from source (Cloud Build packs container)"
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "MONGODB_DB=logitrack" \
  --set-secrets "MONGODB_URI=mongodb-uri:latest"

echo "▶ Done. URL:"
gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)'
