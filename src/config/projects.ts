import type { Project } from "@/types";

/**
 * Projects are taken from the resume. Fields the resume does not state
 * (e.g. detailed decisions) are intentionally kept to what is documented.
 * Repo URLs are the real links embedded in the resume PDF.
 */
export const projects: Project[] = [
  {
    id: "aws-cicd",
    title: "CI/CD Pipeline Development on AWS",
    category: "CI/CD automation",
    overview:
      "An automated CI/CD pipeline for a static website built with GitHub, Maven, AWS CodeArtifact, CodeBuild, CodeDeploy, CodePipeline and CloudFormation.",
    problem: "Minimise manual intervention and ensure consistent, error-free releases through streamlined deployment workflows.",
    architecture: "GitHub → CodePipeline → CodeBuild (Maven, CodeArtifact) → CodeDeploy, with the infrastructure defined in CloudFormation.",
    stack: ["GitHub", "Maven", "AWS CodeArtifact", "AWS CodeBuild", "AWS CodeDeploy", "AWS CodePipeline", "CloudFormation"],
    decisions: ["Infrastructure as Code via CloudFormation for repeatable environments", "Fully automated build-and-deploy workflow"],
    repo: "https://github.com/harishkumar04/Devops-project",
  },
  {
    id: "eks-cicd",
    title: "End-to-End Cloud-Native CI/CD Pipeline",
    category: "Kubernetes deployments",
    overview:
      "An end-to-end pipeline using GitHub, Jenkins, Docker, Kubernetes (AWS EKS) and Helm, with a production-ready EKS environment and full observability.",
    problem: "Automate application deployment through containerised workflows and deliver it with scalable, observable cloud-native infrastructure.",
    architecture:
      "GitHub → Jenkins → Docker → Helm → AWS EKS, fronted by an NGINX Ingress Controller, AWS Load Balancer and Cloudflare DNS routing, with PostgreSQL StatefulSets on persistent storage.",
    stack: ["Jenkins", "Docker", "Kubernetes (EKS)", "Helm", "NGINX Ingress", "PostgreSQL", "Prometheus", "Grafana", "Loki", "Cloudflare"],
    decisions: ["Kubernetes manifest templating and Helm chart management", "PostgreSQL as StatefulSets with persistent storage", "Prometheus, Grafana and Loki for metrics, dashboards and centralised logging"],
    repo: "https://github.com/harishkumar04/End-to-End-Devops-Pipeline.git",
  },
  {
    id: "jenkins-rca",
    title: "Jenkins AI RCA Agent",
    category: "Monitoring and observability",
    overview:
      "An AI-powered root-cause-analysis agent for Jenkins pipelines built with Python, FastAPI, OpenAI GPT-4o-mini, SQLite and Docker.",
    problem: "Reduce mean time to recovery for failed builds through automated failure analysis, recurring-incident detection and alerting.",
    architecture:
      "Build-failure analysis service (FastAPI) with SHA-256 fingerprinting for recurring incidents, team-based owner routing, SMTP alerting, SQLite storage and a real-time failure-analytics dashboard.",
    stack: ["Python", "FastAPI", "OpenAI GPT-4o-mini", "SQLite", "Docker"],
    decisions: ["SHA-256 fingerprints to detect recurring failures", "AI-generated RCA reports with resolution playbooks", "Team-based owner routing with SMTP alerts"],
    repo: "https://github.com/harishkumar04/Jenkins-RCA-Agent.git",
  },
  {
    id: "rag-bedrock",
    title: "RAG Chatbot using AWS Bedrock",
    category: "RAG chatbot infrastructure",
    overview:
      "A Retrieval-Augmented Generation chatbot giving context-aware answers from uploaded documents.",
    problem: "Provide relevant, context-aware answers grounded in user-uploaded documents.",
    architecture: "Amazon S3 for secure document storage, Amazon Bedrock for LLM orchestration, and Amazon OpenSearch Serverless for vector search and retrieval.",
    stack: ["Amazon S3", "Amazon Bedrock", "Amazon OpenSearch Serverless"],
    decisions: ["Custom prompts designed and fine-tuned to improve response accuracy and relevance"],
    repo: "https://github.com/harishkumar04/RAG-Chatbot-using-AWS-Bedrock/blob/main/RAG%20Chatbot.md",
  },
  {
    id: "email-extension",
    title: "AI-Powered Email Reply Chrome Extension",
    category: "CI/CD automation",
    overview:
      "Production-ready infrastructure for a FastAPI application with a GitHub Actions CI/CD pipeline, monitoring and containerised deployment.",
    problem: "Deploy and observe an AI email-reply service reliably, with automated testing and quality gates.",
    architecture:
      "GitHub Actions pipeline with automated testing, code-quality gates and security scanning; Prometheus and Grafana tracking five performance metrics (response times, cache efficiency, API success rate); Docker for multi-service deployment.",
    stack: ["FastAPI", "GitHub Actions", "Docker", "Prometheus", "Grafana"],
    decisions: ["Intelligent caching to reduce response times", "Automated testing, quality gates and security scanning in CI"],
    repo: "https://github.com/harishkumar04/Email-Responder-Chrome-Extension",
  },
];
