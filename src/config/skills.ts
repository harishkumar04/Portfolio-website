import type { SkillCategory } from "@/types";

/** Six containers. Names come from the resume and the project list; no ratings. */
export const skillCategories: SkillCategory[] = [
  { id: "cloud", label: "Cloud and AWS", short: "Cloud", items: ["AWS", "EC2", "S3", "IAM", "VPC", "RDS", "EKS", "Amazon Bedrock", "OpenSearch", "CodeArtifact"] },
  { id: "containers", label: "Containers and Orchestration", short: "Containers", items: ["Docker", "Kubernetes", "Helm"] },
  { id: "cicd", label: "CI/CD and Automation", short: "CI/CD", items: ["Jenkins", "GitHub Actions", "Git", "Maven", "CodeBuild", "CodeDeploy", "CodePipeline"] },
  { id: "iac", label: "Infrastructure as Code", short: "IaC", items: ["Terraform", "CloudFormation"] },
  { id: "observability", label: "Monitoring and Observability", short: "Monitoring", items: ["Prometheus", "Grafana", "Loki", "ELK Stack", "Zabbix", "OpenTelemetry"] },
  { id: "languages", label: "Programming and Databases", short: "Code", items: ["Python", "Java", "C", "MySQL", "PostgreSQL", "Linux"] },
];

export const skillById = (id: string | null | undefined) => skillCategories.find((c) => c.id === id);
