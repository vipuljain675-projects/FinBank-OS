terraform {
  required_providers {
    render = {
      source = "render-oss/render"
      version = "1.2.0"
    }
  }
}

provider "render" {
  api_key  = var.render_api_key
  owner_id = "tea-d58k22qli9vc73a4ac00" # Your Team/Owner ID
}

# --- VARIABLES ---
variable "render_api_key" { type = string }
variable "mongodb_uri" { type = string }
variable "jwt_secret" { type = string }

# --- THE INFRASTRUCTURE ---
resource "render_web_service" "finbank_staging" {
  name     = "finbank-staging-env"
  plan     = "free"
  region   = "singapore"

  runtime_source = {
    image = {
      image_url = "docker.io/vipuljain675/finbank-os"
      tag       = "latest"
    }
  }

  env_vars = {
    "MONGODB_URI" = { value = var.mongodb_uri }
    "JWT_SECRET"  = { value = var.jwt_secret }
    "HOSTNAME"    = { value = "0.0.0.0" }
    "NODE_ENV"    = { value = "production" }
  }

  # 🛡️ THIS IS THE FIX 🛡️
  # We tell Terraform to ignore the buggy field
  lifecycle {
    ignore_changes = [maintenance_mode]
  }
}