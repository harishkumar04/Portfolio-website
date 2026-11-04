import type { Portfolio } from "@/types";

/**
 * Single source of truth for personal content.
 * Everything here comes from the resume — edit freely, nothing else needs to change.
 */
export const portfolio: Portfolio = {
  resume: { href: "/resume/R_Harish_Kumar_Resume.pdf", filename: "R_Harish_Kumar_Resume.pdf" },
  name: "R Harish Kumar",
  firstName: "Harish",
  tagline: "Building, deploying and scaling technology.",
  disciplines: ["Cloud", "DevOps", "Infrastructure", "Automation"],
  intro: [
    "Hi, I'm Harish.",
    "I enjoy building reliable infrastructure, automating deployments, and exploring cloud-native technologies.",
    "I'm particularly interested in DevOps, Cloud Engineering, Platform Engineering, and Site Reliability Engineering.",
  ],
  interests: ["DevOps", "Cloud Engineering", "Platform Engineering", "Site Reliability Engineering"],
  summary:
    "AWS Certified Cloud Practitioner and a final-year Computer Science student with a strong foundation in cloud technologies and hands-on experience through academic projects and certifications. Passionate about building scalable, efficient systems and contributing to innovative cloud-based solutions.",
  closingLine: "Let's build something meaningful.",
  contact: { email: "rharish0909@gmail.com", location: "Chennai, Tamil Nadu" },
  links: {
    github: { label: "GitHub", href: "https://github.com/harishkumar04" },
    linkedin: { label: "LinkedIn", href: "https://www.linkedin.com/in/r-harish-kumar" },
  },
  education: [
    {
      id: "btech",
      kind: "education",
      title: "B.Tech in Computer Science and Business Systems",
      organization: "Vellore Institute of Technology, AP",
      period: "Expected 2026",
      details: ["CGPA: 9.01"],
    },
    { id: "12th", kind: "education", title: "12th Grade", period: "2022", details: ["Percentage: 80%"] },
  ],
  experience: [
    {
      id: "justo",
      kind: "internship",
      title: "DevOps Intern",
      organization: "Justo Global",
      period: "March 2026 – Present",
      location: "Chennai, Tamil Nadu",
    },
    {
      id: "lnt",
      kind: "internship",
      title: "Intern",
      organization: "L&T Technology Services",
      period: "June 2024 – July 2024",
      location: "Chennai, Tamil Nadu",
      details: [
        "Worked on system monitoring and visualization with log management in the ELK Stack.",
        "Built a real-time Grafana dashboard on COVID-19 datasets, integrating MySQL for efficient data retrieval and dynamic monitoring.",
      ],
      tools: ["Docker", "MySQL", "Linux", "Zabbix", "ELK Stack", "Grafana"],
    },
    {
      id: "nextgen",
      kind: "experience",
      title: "Co-Lead of Tech Days",
      organization: "NextGen Cloud, VIT-AP",
      period: "Oct 2022 – 2024",
      details: [
        "Created weekly AI/ML educational content for social media.",
        "Coordinated content planning and social media strategy.",
      ],
    },
  ],
  certifications: [
    { id: "aws-ccp", kind: "certification", title: "AWS Certified Cloud Practitioner" },
    { id: "java", kind: "certification", title: "Java", organization: "Apna College" },
    { id: "net", kind: "certification", title: "Basics of Networking", organization: "Cisco" },
    { id: "ai", kind: "certification", title: "Responsible and Safe AI", organization: "IIT Madras" },
  ],
  milestones: [
    {
      id: "datasprint",
      kind: "milestone",
      title: "Datasprint 3.0 — 4th place of 25 teams",
      organization: "24-hour data analytics hackathon",
      details: [
        "Completed 4 competitive rounds: Power BI preprocessing, feature engineering and end-to-end ML model development.",
      ],
    },
  ],
};
