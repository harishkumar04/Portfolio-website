import type { Project } from "@/types";

/**
 * Projects come from the resume and the linked GitHub repositories. Text is limited to what the
 * resume states; optional fields (demo, image, contribution) are simply omitted when unknown.
 * Add `demo: "https://…"` or `image: "/projects/<file>"` here and the UI shows them automatically.
 */
export const projects: Project[] = [
  {
    id: "aws-cicd", code: "PRJ-01", category: "CI/CD automation",
    title: "CI/CD Pipeline Development on AWS",
    summary: "An automated CI/CD pipeline for a static website, defined as code with AWS CloudFormation.",
    problem: "Releases needed to be consistent and error-free, with as little manual intervention as possible.",
    solution: "A fully automated delivery workflow that streamlines deployments and removes manual release steps.",
    layers: [
      { label: "Source", items: ["GitHub"] },
      { label: "Build", items: ["Maven", "AWS CodeBuild", "AWS CodeArtifact"] },
      { label: "Release", items: ["AWS CodePipeline", "AWS CodeDeploy"] },
      { label: "Infrastructure as Code", items: ["AWS CloudFormation"] },
    ],
    stack: ["GitHub", "Maven", "AWS CodeArtifact", "AWS CodeBuild", "AWS CodeDeploy", "AWS CodePipeline", "CloudFormation"],
    contribution: "Designed and automated the pipeline.",
    repo: "https://github.com/harishkumar04/Devops-project",
  },
  {
    id: "eks-cicd", code: "PRJ-02", category: "Kubernetes deployments",
    title: "End-to-End Cloud-Native CI/CD Pipeline",
    summary: "A containerised delivery pipeline onto a production-ready AWS EKS environment with full observability.",
    problem: "Application deployment needed to be automated through containerised workflows, on scalable and observable cloud-native infrastructure.",
    solution: "Kubernetes manifest templating and Helm chart management, an EKS environment with ingress, load balancing and DNS routing, and metrics, dashboards and centralised logging.",
    layers: [
      { label: "CI", items: ["GitHub", "Jenkins"] },
      { label: "Package", items: ["Docker", "Helm"] },
      { label: "Runtime", items: ["AWS EKS", "NGINX Ingress Controller", "AWS Load Balancer"] },
      { label: "Edge", items: ["Cloudflare DNS"] },
      { label: "Data", items: ["PostgreSQL StatefulSets", "Persistent storage"] },
      { label: "Observability", items: ["Prometheus", "Grafana", "Loki"] },
    ],
    stack: ["Jenkins", "Docker", "Kubernetes (EKS)", "Helm", "NGINX Ingress", "PostgreSQL", "Prometheus", "Grafana", "Loki", "Cloudflare"],
    contribution: "Designed and implemented the pipeline end to end.",
    repo: "https://github.com/harishkumar04/End-to-End-Devops-Pipeline",
  },
  {
    id: "jenkins-rca", code: "PRJ-03", category: "Monitoring and observability",
    title: "Jenkins AI RCA Agent",
    summary: "An AI-powered root-cause-analysis agent for Jenkins pipelines.",
    problem: "Failed builds took time to diagnose; the aim was to reduce mean time to recovery.",
    solution: "Automated build-failure analysis with recurring-incident detection, team-based owner routing and SMTP alerting, plus AI-generated RCA reports, resolution playbooks and real-time failure analytics dashboards.",
    layers: [
      { label: "Service", items: ["Python", "FastAPI"] },
      { label: "Analysis", items: ["OpenAI GPT-4o-mini", "SHA-256 failure fingerprinting"] },
      { label: "Storage", items: ["SQLite"] },
      { label: "Delivery", items: ["Docker", "SMTP alerts"] },
    ],
    stack: ["Python", "FastAPI", "OpenAI GPT-4o-mini", "SQLite", "Docker"],
    contribution: "Built the agent.",
    repo: "https://github.com/harishkumar04/Jenkins-RCA-Agent",
  },
  {
    id: "rag-bedrock", code: "PRJ-04", category: "RAG chatbot infrastructure",
    title: "RAG Chatbot using AWS Bedrock",
    summary: "A Retrieval-Augmented Generation chatbot that answers from uploaded documents.",
    problem: "Provide context-aware answers grounded in the user's own documents.",
    solution: "Documents are stored in S3, Amazon Bedrock orchestrates the language model, and OpenSearch Serverless provides high-performance vector search and retrieval.",
    layers: [
      { label: "Storage", items: ["Amazon S3"] },
      { label: "Retrieval", items: ["Amazon OpenSearch Serverless"] },
      { label: "Generation", items: ["Amazon Bedrock"] },
    ],
    stack: ["Amazon S3", "Amazon Bedrock", "Amazon OpenSearch Serverless"],
    contribution: "Designed and fine-tuned custom prompts to increase response accuracy and relevance.",
    repo: "https://github.com/harishkumar04/RAG-Chatbot-using-AWS-Bedrock/blob/main/RAG%20Chatbot.md",
  },
  {
    id: "email-extension", code: "PRJ-05", category: "CI/CD automation",
    title: "AI-Powered Email Reply Chrome Extension",
    summary: "Production-ready infrastructure for a FastAPI application, with a GitHub Actions pipeline and monitoring.",
    problem: "Deploy and observe an AI email-reply service reliably, with automated testing and quality gates.",
    solution: "A GitHub Actions pipeline with automated testing, code-quality gates and security scanning, a containerised multi-service deployment, and Prometheus and Grafana monitoring five performance metrics.",
    layers: [
      { label: "Application", items: ["FastAPI", "Intelligent caching"] },
      { label: "CI/CD", items: ["GitHub Actions", "Automated tests", "Quality gates", "Security scanning"] },
      { label: "Runtime", items: ["Docker"] },
      { label: "Monitoring", items: ["Prometheus", "Grafana"] },
    ],
    stack: ["FastAPI", "GitHub Actions", "Docker", "Prometheus", "Grafana"],
    contribution: "Built the infrastructure, pipeline and monitoring around the application.",
    repo: "https://github.com/harishkumar04/Email-Responder-Chrome-Extension",
  },
  {
    id: "roads-that-honk", code: "PRJ-06", category: "Embedded systems",
    title: "Roads that Honk",
    summary: "A real-time vehicle detection and alert system for hairpin bends.",
    problem: "Drivers cannot see incoming vehicles around hairpin bends.",
    solution: "Ultrasonic sensors and a Wi-Fi module identify approaching vehicles and trigger automated alerts: blinking lights and a horn, to improve driver awareness and reduce accident risk.",
    layers: [
      { label: "Sensing", items: ["Ultrasonic sensor"] },
      { label: "Control", items: ["Arduino", "Wi-Fi module"] },
      { label: "Alerts", items: ["Blinking lights", "Horn"] },
    ],
    stack: ["Arduino", "Ultrasonic sensor", "Wi-Fi module"],
    contribution: "Developed the detection and alert system.",
  },
];

export const projectById = (id: string | null | undefined) => projects.find((p) => p.id === id);
