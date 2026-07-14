terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "fridge-tracker-tfstate-979311683174"
    key            = "fridge-tracker/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "fridge-tracker-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "fridge-tracker"
      ManagedBy   = "terraform"
      Environment = "production"
    }
  }
}

# Look up existing resources rather than hardcoding IDs
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_caller_identity" "current" {}