import type { Project } from "@/types";

/**
 * Projects come from the resume and the linked GitHub repositories; text is limited to what the
 * resume states. Add `demo: "https://…"` or `image: "/projects/<file>"` to a project and the UI
 * shows them automatically. Empty fields are never rendered.
 */
export const projects: Project[] = [
  {
    id: "aws-cicd",
    title: "CI/CD Pipeline on AWS",
    summary: "An automated delivery pipeline for a static website, defined as code, so releases are consistent and need no manual steps.",
    tags: ["CodePipeline", "CodeBuild", "CodeDeploy", "CloudFormation", "Maven"],
    repo: "https://github.com/harishkumar04/Devops-project",
  },
  {
    id: "eks-cicd",
    title: "Cloud-Native CI/CD on EKS",
    summary: "An end-to-end pipeline from GitHub to a production-ready AWS EKS environment, with Helm releases and full observability.",
    tags: ["Jenkins", "Docker", "Kubernetes", "Helm", "Prometheus"],
    repo: "https://github.com/harishkumar04/End-to-End-Devops-Pipeline",
  },
  {
    id: "jenkins-rca",
    title: "Jenkins AI RCA Agent",
    summary: "An AI-powered agent that analyses failed Jenkins builds, detects recurring incidents and alerts the right team.",
    tags: ["Python", "FastAPI", "GPT-4o-mini", "SQLite", "Docker"],
    repo: "https://github.com/harishkumar04/Jenkins-RCA-Agent",
  },
  {
    id: "rag-bedrock",
    title: "RAG Chatbot on AWS Bedrock",
    summary: "A Retrieval-Augmented Generation chatbot that gives context-aware answers from uploaded documents.",
    tags: ["Bedrock", "S3", "OpenSearch Serverless"],
    repo: "https://github.com/harishkumar04/RAG-Chatbot-using-AWS-Bedrock/blob/main/RAG%20Chatbot.md",
  },
  {
    id: "email-extension",
    title: "AI Email Reply Extension",
    summary: "Production-ready infrastructure for a FastAPI service: GitHub Actions pipeline, containers and Prometheus and Grafana monitoring.",
    tags: ["FastAPI", "GitHub Actions", "Docker", "Prometheus", "Grafana"],
    repo: "https://github.com/harishkumar04/Email-Responder-Chrome-Extension",
  },
  {
    id: "roads-that-honk",
    title: "Roads that Honk",
    summary: "A real-time vehicle detection and alert system for hairpin bends, using ultrasonic sensors and a Wi-Fi module.",
    tags: ["Arduino", "Ultrasonic sensor", "Wi-Fi module"],
  },
];

export const projectById = (id: string | null | undefined) => projects.find((p) => p.id === id);
