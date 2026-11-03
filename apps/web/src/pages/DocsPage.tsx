import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Database,
  DollarSign,
  Play,
  ExternalLink,
  ShieldCheck,
  Server,
  Cloud,
  Code2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'services' | 'er' | 'cost' | 'demo'>('architecture');

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-rq-border gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-rq-ink flex items-center space-x-2">
              <FileText className="w-5 h-5 text-rq-brand" />
              <span>ResQGrid Technical Documentation & System Specifications</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
              Cloud Architecture Spec
            </span>
          </div>
          <p className="text-xs text-rq-muted mt-1 font-mono">
            Mermaid system diagrams, service justification matrix, ER relational schema, cost trade-off analysis, and evaluation walkthrough script.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-rq-border rounded-lg text-xs font-mono text-rq-ink shadow-sm transition"
          >
            <Code2 className="w-3.5 h-3.5 text-rq-brand" />
            <span>Interactive OpenAPI (Swagger)</span>
            <ExternalLink className="w-3 h-3 text-rq-muted" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-rq-border overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono font-bold rounded-lg transition ${
            activeTab === 'architecture'
              ? 'bg-[#14284B] text-white'
              : 'text-rq-muted hover:text-rq-ink hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Architecture (Mermaid)</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono font-bold rounded-lg transition ${
            activeTab === 'services'
              ? 'bg-[#14284B] text-white'
              : 'text-rq-muted hover:text-rq-ink hover:bg-slate-100'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Service Justification</span>
        </button>

        <button
          onClick={() => setActiveTab('er')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono font-bold rounded-lg transition ${
            activeTab === 'er'
              ? 'bg-[#14284B] text-white'
              : 'text-rq-muted hover:text-rq-ink hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>ER Schema Diagram</span>
        </button>

        <button
          onClick={() => setActiveTab('cost')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono font-bold rounded-lg transition ${
            activeTab === 'cost'
              ? 'bg-[#14284B] text-white'
              : 'text-rq-muted hover:text-rq-ink hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Cost & Anti-Pattern Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('demo')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono font-bold rounded-lg transition ${
            activeTab === 'demo'
              ? 'bg-[#14284B] text-white'
              : 'text-rq-muted hover:text-rq-ink hover:bg-slate-100'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Live Demo Script</span>
        </button>
      </div>

      {/* Tab 1: Architecture Mermaid */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-rq-ink flex items-center space-x-2">
              <Layers className="w-4 h-4 text-rq-brand" />
              <span>ResQGrid Cloud-Native Architecture Diagram (ap-south-1 Mumbai)</span>
            </h2>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
              <pre>{`flowchart TD
    subgraph Internet [Public Internet]
        Citizen["Citizen Mobile PWA (/report)"]
        Operator["Command Room (/command)"]
        Responder["Field Responder (/responder)"]
    end

    subgraph AWS [AWS Cloud: ap-south-1 Mumbai]
        subgraph VPC [Custom VPC: 10.0.0.0/16]
            IGW["Internet Gateway"]
            
            subgraph PublicSubnets ["Public Subnets (10.0.1.0/24 & 10.0.2.0/24)"]
                ALB["Application Load Balancer (resqgrid-alb-sg)"]
                ASG["Auto Scaling Group: t3.micro EC2 (resqgrid-app-sg)"]
                subgraph ContainerStack ["Container Stack (Docker)"]
                    API["FastAPI Engine (Port 8000)"]
                    Worker["Background SQS Worker"]
                end
            end

            subgraph PrivateSubnets ["Private Database Subnets (10.0.11.0/24 & 10.0.12.0/24)"]
                RDS[("Amazon RDS PostgreSQL 16.1\\ndb.t3.micro (Single-AZ)\\n(resqgrid-db-sg: Ingress 5432 from App Only)")]
            end

            S3EP["S3 VPC Gateway Endpoint\\n(Zero Cost, No NAT Gateway Needed)"]
        end

        subgraph ManagedServices ["AWS Managed Cloud Capabilities"]
            S3Vault[("Amazon S3 Buckets\\n- Evidence Storage (SSE-AES256)\\n- Reports & PDFs\\n- DB Backups")]
            SQSQueue["Amazon SQS Pipeline + DLQ\\n(FIFO/Standard Decoupled Dispatch)"]
            SNSTopic["Amazon SNS Topics\\n(Critical Escalations & Shortage Alarms)"]
            CW["Amazon CloudWatch\\n(Logs, Metric Alarms, SQS Age > 120s)"]
            SSM["AWS SSM Parameter Store\\n(SecureString DB & JWT Secrets)"]
            Budgets["AWS Budgets ($20.00 Cost Cap\\nAlerts at 50%, 80%, 100%)"]
            ML["AWS Worker ML (Worker Role Only)\\n- Rekognition (Hazard Identification)\\n- Translate (Hindi/Marathi to English)\\n- Comprehend (Urgency Extraction)"]
        end
    end

    Citizen -->|HTTPS| ALB
    Operator -->|HTTPS| ALB
    Responder -->|HTTPS| ALB
    ALB -->|Port 8000| ASG
    ASG --> ContainerStack
    API -->|Port 5432| RDS
    API -->|Async Outbox / SQS| SQSQueue
    SQSQueue --> Worker
    Worker --> RDS
    Worker --> ML
    API -->|KMS Presigned URLs| S3Vault
    API --> S3EP --> S3Vault
    API --> SNSTopic
    CW -.->|Monitors Backlog| SQSQueue
    CW -->|Fires SNS Alert| SNSTopic
    SSM -.->|Injects Config| ContainerStack`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Service Justification */}
      {activeTab === 'services' && (
        <div className="bg-white border border-rq-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-rq-border bg-rq-surface2">
            <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-rq-ink">
              AWS Service Justification Matrix & Architectural Rationale
            </h2>
            <p className="text-xs text-rq-muted font-mono mt-1">
              Every single AWS service selected fulfills an indispensable disaster-response requirement with zero superfluous resources.
            </p>
          </div>
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-rq-border text-rq-muted uppercase font-mono">
              <tr>
                <th className="px-4 py-3 font-semibold">AWS Service</th>
                <th className="px-4 py-3 font-semibold">Tier / Resource Class</th>
                <th className="px-4 py-3 font-semibold">Concrete Disaster System Function</th>
                <th className="px-4 py-3 font-semibold">Cost Optimization Choice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rq-border">
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-rq-ink font-mono">Amazon EC2 (ASG)</td>
                <td className="px-4 py-3 font-mono text-rq-muted">t3.micro (2 vCPU, 1GB RAM)</td>
                <td className="px-4 py-3">Executes containerized FastAPI API engine and asynchronous event worker.</td>
                <td className="px-4 py-3 font-mono text-emerald-700">Min 1, Max 2 scaling bounds</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-rq-ink font-mono">Application Load Balancer</td>
                <td className="px-4 py-3 font-mono text-rq-muted">ALB (Multi-AZ Public Subnets)</td>
                <td className="px-4 py-3">Public HTTP entrypoint with health-check-based traffic distribution across nodes.</td>
                <td className="px-4 py-3 font-mono text-emerald-700">Zero idle ALB pre-warming costs</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-rq-ink font-mono">Amazon RDS PostgreSQL</td>
                <td className="px-4 py-3 font-mono text-rq-muted">db.t3.micro (20GB gp3)</td>
                <td className="px-4 py-3">Authoritative relational data store providing strict ACID transactions, row-level locking for inventory, and spatial indices.</td>
                <td className="px-4 py-3 font-mono text-emerald-700">Single-AZ in private subnet (Saves $30/mo)</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-rq-ink font-mono">Amazon S3</td>
                <td className="px-4 py-3 font-mono text-rq-muted">Standard with Lifecycle Expiry</td>
                <td className="px-4 py-3">Encrypted vaults for incident photos, PDF situation briefs, and automated nightly pg_dump snapshots.</td>
                <td className="px-4 py-3 font-mono text-emerald-700">S3 Gateway Endpoint ($0.00 data transfer)</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-rq-ink font-mono">Amazon SQS + DLQ</td>
                <td className="px-4 py-3 font-mono text-rq-muted">Standard Queue + Redrive DLQ</td>
                <td className="px-4 py-3">Decouples emergency report submission from background heavy scoring and notification fan-out.</td>
                <td className="px-4 py-3 font-mono text-emerald-700">Free Tier (1M requests/mo)</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-rq-ink font-mono">Amazon SNS</td>
                <td className="px-4 py-3 font-mono text-rq-muted">Standard Topics</td>
                <td className="px-4 py-3">Publishes high-priority emergency escalation alerts to field squads and command authorities.</td>
                <td className="px-4 py-3 font-mono text-emerald-700">Free Tier (100k email notifications/mo)</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-rq-ink font-mono">Amazon CloudWatch</td>
                <td className="px-4 py-3 font-mono text-rq-muted">Logs + Metric Alarms</td>
                <td className="px-4 py-3">Monitors SQS queue depth, ALB 5xx rate, and inventory depletion with automated SNS triggers.</td>
                <td className="px-4 py-3 font-mono text-emerald-700">7-day log retention cap</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-rq-ink font-mono">AWS SSM Parameter Store</td>
                <td className="px-4 py-3 font-mono text-rq-muted">Standard (SecureString KMS)</td>
                <td className="px-4 py-3">Centralized, encrypted credential and database connection string repository.</td>
                <td className="px-4 py-3 font-mono text-emerald-700">$0.00 (Standard parameters free)</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-rq-ink font-mono">AWS Budgets</td>
                <td className="px-4 py-3 font-mono text-rq-muted">Cost Cap Policy</td>
                <td className="px-4 py-3">Hard budget limit of $20.00/month with alert triggers at 50%, 80%, and 100% forecast.</td>
                <td className="px-4 py-3 font-mono text-emerald-700">Prevents university credit overruns</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: ER Schema */}
      {activeTab === 'er' && (
        <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-rq-ink flex items-center space-x-2">
            <Database className="w-4 h-4 text-rq-brand" />
            <span>Relational Entity Relationship (ER) Schema</span>
          </h2>
          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
            <pre>{`erDiagram
    USERS ||--o{ INCIDENTS : reports
    USERS ||--o{ ASSIGNMENTS : manages
    INCIDENTS ||--o{ INCIDENTS : parent_child_merge
    INCIDENTS ||--o{ INCIDENT_EVENTS : logs_timeline
    INCIDENTS ||--o{ INCIDENT_EVIDENCE : attaches_media
    INCIDENTS ||--o{ ASSIGNMENTS : dispatched_to
    TEAMS ||--o{ TEAM_MEMBERS : comprises
    TEAMS ||--o{ ASSIGNMENTS : assigned_mission
    DEPOTS ||--o{ DEPOT_STOCK : stores_inventory
    ITEMS ||--o{ DEPOT_STOCK : item_catalog
    ASSIGNMENTS ||--o{ STOCK_RESERVATIONS : reserves_equipment
    DEPOT_STOCK ||--o{ STOCK_MOVEMENTS : audit_ledger
    OUTBOX_EVENTS ||--o{ SQS_QUEUE : asynchronously_publishes

    INCIDENTS {
        uuid id PK
        string tracking_id UK
        string title
        string category
        string severity
        string status
        float latitude
        float longitude
        int affected_people
        float priority_score
        uuid parent_incident_id FK
        int report_count
        int version
        timestamp created_at
    }

    ASSIGNMENTS {
        uuid id PK
        uuid incident_id FK
        uuid team_id FK
        string status
        int version
        timestamp assigned_at
        timestamp resolved_at
    }

    DEPOT_STOCK {
        uuid id PK
        uuid depot_id FK
        uuid item_id FK
        int quantity_on_hand
        int quantity_reserved
        int version
    }

    STOCK_RESERVATIONS {
        uuid id PK
        uuid assignment_id FK
        uuid stock_id FK
        int reserved_quantity
        string status
    }`}</pre>
          </div>
        </div>
      )}

      {/* Tab 4: Cost Analysis */}
      {activeTab === 'cost' && (
        <div className="space-y-6">
          <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-rq-ink flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>AWS Cost Optimization & Avoided Anti-Patterns</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                <h3 className="font-bold text-emerald-900 text-xs font-mono uppercase flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Cost-Effective Architected Choices ($18-24/mo)</span>
                </h3>
                <ul className="text-xs text-emerald-800 space-y-1.5 font-sans leading-relaxed list-disc list-inside">
                  <li><strong>Zero NAT Gateway ($0.00)</strong>: Direct S3 Gateway Endpoint + public IPs on compute instances for AWS API calls saves <strong>$32.85/month</strong> per AZ.</li>
                  <li><strong>Single-AZ RDS PostgreSQL ($13.20/mo)</strong>: Multi-AZ would double DB costs (~$26.40/mo). High-availability requirements are met via automated daily snapshots and logical pg_dump backups to S3.</li>
                  <li><strong>t3.micro EC2 Instance Tier ($7.50/mo)</strong>: Sufficient CPU credit accumulation and container performance for sub-second disaster API response times.</li>
                  <li><strong>S3 Lifecycle Expiry ($0.15/mo)</strong>: Temporary simulation evidence automatically cleaned after 30 days.</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                <h3 className="font-bold text-red-900 text-xs font-mono uppercase flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Avoided Cost Traps & Superfluous Services</span>
                </h3>
                <ul className="text-xs text-red-800 space-y-1.5 font-sans leading-relaxed list-disc list-inside">
                  <li><strong>NAT Gateways ($65.70/mo avoided)</strong>: Would consume 320% of the entire project budget with zero added educational value.</li>
                  <li><strong>OpenSearch / Elasticsearch ($38.00/mo avoided)</strong>: Replaced by PostgreSQL native full-text search and GIN indexing.</li>
                  <li><strong>Multi-AZ RDS Replication ($14.00/mo avoided)</strong>: Unnecessary for university demonstration projects; snapshot recovery is sufficient.</li>
                  <li><strong>AWS Glue / Redshift ($50.00+/mo avoided)</strong>: Analytics aggregations performed directly via efficient SQL views and window functions.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Live Demo Script */}
      {activeTab === 'demo' && (
        <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-rq-ink flex items-center space-x-2">
            <Play className="w-4 h-4 text-rq-brand" />
            <span>Faculty Evaluation Walkthrough Script (8-10 Minutes)</span>
          </h2>
          <div className="space-y-4 text-xs font-sans text-rq-ink leading-relaxed">
            <div className="p-3 bg-rq-surface2 border border-rq-border rounded-lg">
              <div className="font-bold font-mono text-rq-brand uppercase">Step 1: Emergency Reporting & Duplicate Merge (2 min)</div>
              <p className="mt-1 text-rq-muted">
                Navigate to <code>/report</code>. Drop a pin near Hindmata Junction (Dadar) and submit a Flood report. Submit a second corroborating report within 150m. 
                Open <code>/command</code>: observe that the report count increments to 2, preventing duplicate queue congestion.
              </p>
            </div>

            <div className="p-3 bg-rq-surface2 border border-rq-border rounded-lg">
              <div className="font-bold font-mono text-rq-brand uppercase">Step 2: 3D Tactical Twin & Spatial Triage (2 min)</div>
              <p className="mt-1 text-rq-muted">
                In <code>/command</code>, switch to the 3D Digital Twin. Adjust the flood slider to 1.8m: observe the custom GLSL ripple water shader flooding the low-lying Mithi basin. 
                Inspect top candidate teams with calculated ETAs and equipment readiness. Approve dispatch.
              </p>
            </div>

            <div className="p-3 bg-rq-surface2 border border-rq-border rounded-lg">
              <div className="font-bold font-mono text-rq-brand uppercase">Step 3: Atomic Stock Reservation & Row-Level Locking (2 min)</div>
              <p className="mt-1 text-rq-muted">
                Open <code>/inventory</code>. Observe that approving the mission atomically reserved rescue rafts and medical trauma kits with row-level locks, preventing negative inventory deficits.
              </p>
            </div>

            <div className="p-3 bg-rq-surface2 border border-rq-border rounded-lg">
              <div className="font-bold font-mono text-rq-brand uppercase">Step 4: Cloud Telemetry & Worker Resilience Injection (2 min)</div>
              <p className="mt-1 text-rq-muted">
                Navigate to <code>/health</code>. Show real RDS query latency (&lt;2ms). Click <strong>"1. Pause Worker"</strong>: observe SQS backlog rising to 6 messages. 
                Watch the CloudWatch Alarm transition from <code>OK</code> to <code>ALARM</code> and inspect the simulated SNS alert email. Click <strong>"2. Resume Worker"</strong>: watch the queue drain immediately to 0.
              </p>
            </div>

            <div className="p-3 bg-rq-surface2 border border-rq-border rounded-lg">
              <div className="font-bold font-mono text-rq-brand uppercase">Step 5: Compliance Dossier & Automated Teardown (2 min)</div>
              <p className="mt-1 text-rq-muted">
                Navigate to <code>/evidence</code>: show all 14 faculty conditions passing with verified file paths. Click <strong>"Export Dossier PDF"</strong>. 
                Show the examiner <code>make destroy</code> in the terminal to demonstrate automated clean teardown.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
