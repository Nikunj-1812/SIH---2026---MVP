export interface DemoSource {
  id: string;
  title: string;
  description: string;
  category: string;
  pageCount: number;
  filename: string;
  path: string;
}

export const DEMO_SOURCES: DemoSource[] = [
  {
    id: "demo-pdf-1",
    title: "Standard Cybersecurity Assessment Report",
    description: "Baseline operational cybersecurity audit detailing infrastructure findings, patch compliance, and system recommendations.",
    category: "Cyber Security Audit",
    pageCount: 3,
    filename: "01_normal_cybersecurity_assessment.pdf",
    path: "/demo/01_normal_cybersecurity_assessment.pdf"
  },
  {
    id: "demo-pdf-2",
    title: "PII Security Incident Audit Document",
    description: "Contains sensitive email addresses, phone numbers, and credentials to test Presidio PII detection and automated redaction.",
    category: "PII & Privacy Audit",
    pageCount: 2,
    filename: "02_pii_security_incident_test.pdf",
    path: "/demo/02_pii_security_incident_test.pdf"
  },
  {
    id: "demo-pdf-3",
    title: "Prompt Injection Attack Challenge Document",
    description: "Includes embedded adversarial system override instructions to test sandbox isolation and prompt injection defense heuristics.",
    category: "Threat Defense Test",
    pageCount: 2,
    filename: "03_prompt_injection_security_test.pdf",
    path: "/demo/03_prompt_injection_security_test.pdf"
  },
  {
    id: "demo-pdf-4",
    title: "Fact Accuracy & Technical Detail Brief",
    description: "Contains precise dates, CVE numbers, version strings, and quantitative metrics to verify canonical context factual fidelity.",
    category: "Fact Integrity Test",
    pageCount: 3,
    filename: "04_fact_accuracy_test.pdf",
    path: "/demo/04_fact_accuracy_test.pdf"
  }
];
