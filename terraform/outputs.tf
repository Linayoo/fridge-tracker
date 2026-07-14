output "alb_url" {
  description = "Base URL for the deployed API"
  value       = "http://${aws_lb.main.dns_name}"
}

output "alb_dns_name" {
  description = "Raw DNS name of the ALB (for CNAME setup later)"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "ECR repository URL for pushing images"
  value       = aws_ecr_repository.api.repository_url
}

output "rds_endpoint" {
  description = "RDS Postgres endpoint (private)"
  value       = aws_db_instance.postgres.address
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for the API"
  value       = aws_cloudwatch_log_group.api.name
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.api.name
}

output "secret_arn" {
  description = "ARN of the DATABASE_URL secret"
  value       = aws_secretsmanager_secret.db_url.arn
  sensitive   = true
}