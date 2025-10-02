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

### Execution Engine
- **Sequential Processing**: Linear flow execution with step-by-step progression
- **Context Management**: Persistent context passing between workflow steps
- **Error Handling**: Comprehensive error recovery and retry mechanisms
- **Logging System**: Multi-dimensional logging with session, agent, step, tool, and MCP tagging
- **Real-time Monitoring**: WebSocket-based live execution monitoring

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