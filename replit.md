# Vortic - AI Agent Builder Platform

## Overview

Vortic is a comprehensive no-code/low-code platform for building, orchestrating, and deploying multi-agent AI workflows. The platform enables users to create sophisticated agent workflows through a visual interface, connecting tools like Notion, Slack, and custom APIs. It supports both linear and complex multi-agent orchestration patterns with full traceability and observability.

The application is designed as a full-stack TypeScript platform with React frontend, Express backend, and PostgreSQL database, supporting multiple authentication strategies and external service integrations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query for server state management and React Hook Form for form handling
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: CSS variables system with light/dark mode support and neutral color scheme

### Backend Architecture
- **Framework**: Express.js with TypeScript using ES modules
- **API Design**: RESTful API with standardized error handling and response patterns
- **Authentication**: Flexible auth system supporting both Auth0 and dummy authentication for development
- **File Handling**: Multer for file uploads with type validation and size limits
- **WebSocket Support**: Real-time communication for run execution monitoring and log streaming

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL as the primary database
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema Design**: Comprehensive schema covering users, projects, agents, tools, flows, runs, knowledge bases, and UI components
- **Migrations**: Automated migration system using drizzle-kit

### Core Entity Models
- **Users**: Authentication and profile management
- **Projects**: Workspace containers for organizing work
- **Agents**: AI agents with configurable prompts, schemas, and capabilities
- **Tools**: External integrations (builtin, HTTP, MCP protocol)
- **Flows**: Sequential workflows connecting agents and tools
- **Runs**: Execution instances with full logging and traceability
- **Templates**: Reusable workflow patterns for quick instantiation

### Execution Engine (Dual-Engine Architecture)
- **Legacy Engine**: Sequential flow execution with step-by-step progression (default for existing projects)
- **LangGraph Engine**: Advanced StateGraph-based execution supporting parallel, conditional, and looped workflows
- **Feature Flag System**: Granular control over engine selection and feature rollout per project
- **Engine Selector**: Intelligent routing between engines based on flow complexity and feature enablement
- **Context Management**: Persistent context passing between workflow steps with full state checkpointing
- **Error Handling**: Comprehensive error recovery and retry mechanisms
- **Logging System**: Multi-dimensional logging with session, agent, step, tool, and MCP tagging
- **Real-time Monitoring**: WebSocket-based live execution monitoring
- **Checkpoint/Replay**: Full state persistence enabling time-travel debugging and workflow replay

### Policy Engine (Enterprise Controls)
- **Policy Rules**: Project-level policies defining SLOs, constraints, and fallback strategies
- **Cost Management**: Automatic tracking and enforcement of per-run cost limits
- **Latency SLOs**: Maximum execution time constraints with fallback handling
- **Quality Gates**: Minimum quality score requirements (action recall, hallucination rate, etc.)
- **PII Masking**: Automatic detection and masking of personally identifiable information
- **Guard Rails**: Disallowed tool restrictions, required human approvals, sensitive data protection
- **Model Routing**: Intelligent selection between cost-effective and high-performance models
- **Policy Evaluations**: Complete audit trail of policy enforcement and violations

### Telemetry & Learning Loop (Self-Improving AI)
- **Run Metrics**: Detailed capture of tokens, cost, latency, model used, and quality scores per step
- **Evaluator Service**: Automated measurement of action recall, precision, hallucination rate
- **Intelligent Planner**: Learns from execution history to optimize model and tool selection
- **Cost Optimization**: Automatic escalation to larger models only when small models fail quality targets
- **Performance Tracking**: Real-time dashboards showing SLO compliance, cost trends, quality metrics
- **A/B Testing**: Compare different prompts, models, and configurations with statistical significance

### Skills Registry (Reusable Capabilities)
- **Skill Catalog**: Centralized repository of versioned agent prompts and schemas
- **Quality Metrics**: Each skill tracks success rate, average cost, latency, and quality scores
- **Versioning**: Semantic versioning with changelog and deprecation support
- **Marketplace**: Public/private skill sharing for rapid workflow composition
- **Usage Analytics**: Track which skills are most used and highest performing
- **Smart Composition**: Build new agents by combining proven skill components

### MCP Protocol Integration (Unlimited Extensibility)
- **MCP Server**: Expose Vortic flows and tools as MCP resources for external consumption
- **MCP Client**: Allow Vortic agents to invoke any MCP-compatible tool
- **Credential Management**: Secure handling of authentication for external MCP services
- **Tool Discovery**: Automatic detection and registration of MCP capabilities
- **Bidirectional Integration**: Both provide and consume MCP services

### Knowledge Management
- **Vector Embeddings**: OpenAI text-embedding-3-small for semantic search capabilities
- **Chunking Strategy**: Intelligent text chunking with overlap for optimal retrieval
- **Knowledge Bases**: Organized repositories of domain-specific information
- **Multi-format Support**: Text files, URLs, and structured data ingestion

## External Dependencies

### AI and Language Models
- **OpenAI API**: GPT-5 model for agent reasoning and text generation
- **Embedding Service**: OpenAI embeddings for knowledge retrieval and semantic search

### Authentication Services
- **Auth0**: Primary authentication provider with JWT token management
- **Dummy Auth**: Development authentication system for local testing

### Database and Storage
- **Neon PostgreSQL**: Serverless PostgreSQL database with automatic scaling
- **Session Storage**: PostgreSQL-based session management for authentication

### Third-party Tool Integrations
- **Notion API**: Content creation and database management capabilities
- **Supabase**: Alternative authentication and real-time features
- **MCP (Model Context Protocol)**: Standardized protocol for external tool integration

### Development and Deployment
- **Replit Platform**: Cloud development environment with integrated connectors
- **WebSocket Support**: Real-time communication for execution monitoring
- **File Upload System**: Secure file handling with type validation and processing