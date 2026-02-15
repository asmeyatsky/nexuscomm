# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "nexuscomm" {
  location      = var.region
  repository_id = "nexuscomm"
  description   = "NexusComm container images"
  format        = "DOCKER"
}

# IAM service account for Cloud Run
resource "google_service_account" "nexuscomm" {
  account_id   = "nexuscomm-sa"
  display_name = "NexusComm Service Account"
}

# Backend Cloud Run Service
resource "google_cloud_run_v2_service" "backend" {
  name     = "nexuscomm-backend"
  location = var.region

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/nexuscomm/backend:${var.image_tag}"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "PORT"
        value = "3000"
      }
      env {
        name  = "DATABASE_URL"
        value = var.database_url
      }
      env {
        name  = "REDIS_URL"
        value = var.redis_url
      }
      env {
        name  = "GEMINI_API_KEY"
        value = var.gemini_api_key
      }
      env {
        name  = "WEAVIATE_URL"
        value = var.weaviate_url
      }
      env {
        name  = "WEAVIATE_API_KEY"
        value = var.weaviate_api_key
      }
      env {
        name  = "CLIENT_URL"
        value = google_cloud_run_v2_service.frontend.uri
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }
    }

    service_account = google_service_account.nexuscomm.email
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Frontend Cloud Run Service
resource "google_cloud_run_v2_service" "frontend" {
  name     = "nexuscomm-frontend"
  location = var.region

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/nexuscomm/frontend:${var.image_tag}"

      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = "${google_cloud_run_v2_service.backend.uri}/api"
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }
    }

    service_account = google_service_account.nexuscomm.email
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Allow public access to Cloud Run services
data "google_iam_policy" "noauth" {
  binding {
    role    = "roles/run.invoker"
    members = ["allUsers"]
  }
}

resource "google_cloud_run_v2_service_iam_policy" "backend_noauth" {
  location    = google_cloud_run_v2_service.backend.location
  project     = google_cloud_run_v2_service.backend.project
  service     = google_cloud_run_v2_service.backend.name
  policy_data = data.google_iam_policy.noauth.policy_data
}

resource "google_cloud_run_v2_service_iam_policy" "frontend_noauth" {
  location    = google_cloud_run_v2_service.frontend.location
  project     = google_cloud_run_v2_service.frontend.project
  service     = google_cloud_run_v2_service.frontend.name
  policy_data = data.google_iam_policy.noauth.policy_data
}
