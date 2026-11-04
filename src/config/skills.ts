import type { SkillCategory } from "@/types";

/**
 * Categories follow the brief. Descriptions are generic definitions of each technology,
 * not claims about proficiency. Related projects reference ids in projects.ts.
 */
export const skillCategories: SkillCategory[] = [
  {
    id: "cloud", label: "Cloud", color: "#c2562d",
    blurb: "AWS foundations — AWS Certified Cloud Practitioner.",
    items: [
      { name: "AWS", description: "Amazon's cloud platform for compute, storage, networking and managed services." },
      { name: "IAM", description: "Identity and access management for users, roles and least-privilege policies." },
      { name: "EC2", description: "Resizable virtual servers in the cloud." },
      { name: "S3", description: "Durable object storage." },
      { name: "VPC", description: "Isolated virtual networks with subnets, routing and security controls." },
      { name: "EKS", description: "Managed Kubernetes on AWS." },
    ],
    relatedProjects: ["eks-cicd", "rag-bedrock", "aws-cicd"],
  },
  {
    id: "containers", label: "Containers & Orchestration", color: "#2f6f8f",
    blurb: "Packaging and running workloads consistently.",
    items: [
      { name: "Docker", description: "Containerises applications into portable images." },
      { name: "Kubernetes", description: "Orchestrates containers: scheduling, scaling and self-healing." },
      { name: "Helm", description: "Package manager and templating for Kubernetes manifests." },
    ],
    relatedProjects: ["eks-cicd", "jenkins-rca", "email-extension"],
  },
  {
    id: "cicd", label: "CI/CD", color: "#b8862b",
    blurb: "Automating build, test and release.",
    items: [
      { name: "Jenkins", description: "Extensible automation server for pipelines." },
      { name: "GitHub Actions", description: "Workflow automation built into GitHub." },
      { name: "AWS CodePipeline", description: "Orchestrates release stages on AWS." },
      { name: "CodeBuild", description: "Managed build service." },
      { name: "CodeDeploy", description: "Automates application deployments." },
    ],
    relatedProjects: ["aws-cicd", "eks-cicd", "email-extension"],
  },
  {
    id: "iac", label: "Infrastructure as Code", color: "#6b4a8f",
    blurb: "Infrastructure that is versioned and repeatable.",
    items: [
      { name: "Terraform", description: "Declarative, provider-agnostic infrastructure provisioning." },
      { name: "CloudFormation", description: "AWS-native infrastructure templates." },
    ],
    relatedProjects: ["aws-cicd"],
  },
  {
    id: "observability", label: "Observability", color: "#3f7d58",
    blurb: "Metrics, logs and dashboards.",
    items: [
      { name: "Prometheus", description: "Metrics collection and alerting." },
      { name: "Grafana", description: "Dashboards and visualisation." },
      { name: "Loki", description: "Log aggregation designed to pair with Grafana." },
      { name: "OpenTelemetry", description: "Vendor-neutral telemetry standard for traces, metrics and logs." },
    ],
    relatedProjects: ["eks-cicd", "email-extension"],
  },
  {
    id: "systems", label: "Systems", color: "#7a2f3a",
    blurb: "Operating-system and networking fundamentals.",
    items: [
      { name: "Linux", description: "Command line, processes and administration." },
      { name: "Nginx", description: "Web server, reverse proxy and ingress." },
      { name: "Networking", description: "TCP/IP fundamentals." },
      { name: "DNS", description: "Name resolution and routing." },
      { name: "SSL/TLS", description: "Transport encryption and certificates." },
    ],
    relatedProjects: ["eks-cicd"],
  },
];
