resource "aws_secretsmanager_secret" "db_url" {
  name                    = "${var.project_name}/db-credentials"
  description             = "DATABASE_URL for the fridge-tracker API (managed by Terraform)"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "db_url" {
  secret_id     = aws_secretsmanager_secret.db_url.id
  secret_string = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${var.db_name}?sslmode=require"
}