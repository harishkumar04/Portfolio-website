import type { SkillCategory } from "@/types";

/**
 * Six containers, as in the terminal. Names come from the resume and the project list; item
 * descriptions are generic definitions of the technology, not claims about proficiency.
 * "Used in" context is derived automatically from each project's stack (see lib/skillContext.ts).
 */
export const skillCategories: SkillCategory[] = [
  {
    id: "cloud", code: "CNT-01", label: "Cloud and AWS",
    blurb: "AWS foundations. AWS Certified Cloud Practitioner.",
    items: [
      { name: "AWS", description: "Amazon's cloud platform for compute, storage, networking and managed services." },
      { name: "IAM", description: "Identity and access management: users, roles and least-privilege policies." },
      { name: "EC2", description: "Resizable virtual servers in the cloud." },
      { name: "S3", description: "Durable object storage." },
      { name: "VPC", description: "Isolated virtual networks with subnets, routing and security controls." },
      { name: "RDS", description: "Managed relational databases." },
      { name: "EKS", description: "Managed Kubernetes on AWS." },
      { name: "CloudFormation", description: "AWS-native infrastructure templates." },
      { name: "Amazon Bedrock", description: "Managed foundation-model service for LLM orchestration." },
      { name: "OpenSearch Serverless", description: "Managed search and vector retrieval." },
      { name: "CodeArtifact", description: "Managed artifact repository for build dependencies." },
    ],
    relatedProjects: ["eks-cicd", "rag-bedrock", "aws-cicd"],
  },
  {
    id: "containers", code: "CNT-02", label: "Containers and Orchestration",
    blurb: "Packaging and running workloads consistently.",
    items: [
      { name: "Docker", description: "Packages applications into portable container images." },
      { name: "Kubernetes", description: "Schedules, scales and heals containers." },
      { name: "Helm", description: "Package manager and templating for Kubernetes manifests." },
      { name: "Amazon EKS", description: "Managed Kubernetes control plane on AWS." },
    ],
    relatedProjects: ["eks-cicd", "jenkins-rca", "email-extension"],
  },
  {
    id: "cicd", code: "CNT-03", label: "CI/CD and Automation",
    blurb: "Automating build, test and release.",
    items: [
      { name: "Jenkins", description: "Extensible automation server for pipelines." },
      { name: "GitHub Actions", description: "Workflow automation built into GitHub." },
      { name: "Git", description: "Version control." },
      { name: "Maven", description: "Build automation and dependency management for Java projects." },
      { name: "AWS CodeBuild", description: "Managed build service." },
      { name: "AWS CodeDeploy", description: "Automates application deployments." },
      { name: "AWS CodePipeline", description: "Orchestrates release stages on AWS." },
    ],
    relatedProjects: ["aws-cicd", "eks-cicd", "email-extension"],
  },
  {
    id: "iac", code: "CNT-04", label: "Infrastructure as Code",
    blurb: "Infrastructure that is versioned and repeatable.",
    items: [
      { name: "Terraform", description: "Declarative, provider-agnostic infrastructure provisioning." },
      { name: "CloudFormation", description: "AWS-native infrastructure templates." },
    ],
    relatedProjects: ["aws-cicd"],
  },
  {
    id: "observability", code: "CNT-05", label: "Monitoring and Observability",
    blurb: "Metrics, logs and dashboards.",
    items: [
      { name: "Prometheus", description: "Metrics collection and alerting." },
      { name: "Grafana", description: "Dashboards and visualisation." },
      { name: "Loki", description: "Log aggregation designed to pair with Grafana." },
      { name: "ELK Stack", description: "Elasticsearch, Logstash and Kibana for log management." },
      { name: "Zabbix", description: "Infrastructure and service monitoring." },
      { name: "OpenTelemetry", description: "Vendor-neutral standard for traces, metrics and logs." },
    ],
    relatedProjects: ["eks-cicd", "email-extension"],
  },
  {
    id: "languages", code: "CNT-06", label: "Programming and Databases",
    blurb: "Languages and databases from coursework and projects, plus the operating-system and networking basics underneath.",
    items: [
      { name: "Python", description: "Automation and services (FastAPI)." },
      { name: "Java", description: "Object-oriented programming." },
      { name: "C", description: "Systems-level programming fundamentals." },
      { name: "MySQL", description: "Relational database." },
      { name: "PostgreSQL", description: "Relational database." },
      { name: "Linux", description: "Command line and administration." },
      { name: "TCP/IP", description: "Networking fundamentals." },
    ],
    relatedProjects: ["jenkins-rca", "eks-cicd"],
  },
];

export const skillById = (id: string | null | undefined) => skillCategories.find((c) => c.id === id);
