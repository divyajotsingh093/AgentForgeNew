import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth0";
import { executionEngine } from "./executionEngine";
import { langGraphEngine } from "./langGraphEngine";
import { EmbeddingService } from "./embeddingService";
import { 
  insertProjectSchema, insertAgentSchema, insertToolSchema, insertFlowSchema, insertRunSchema, insertStepSchema, insertSecretSchema,
  insertKnowledgeBaseSchema, insertKnowledgeItemSchema, insertEmbeddingSchema,
  insertDataSourceSchema, insertDataConnectionSchema, insertAgentIntegrationSchema,
  insertAutonomousTriggerSchema, insertTriggerEventSchema, insertUiComponentSchema, insertAgentUiSchema
} from "@shared/schema";
import { seedAllTemplates } from "./seedTemplates";

export async function registerRoutes(app: Express, server?: Server): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow text files, code files, and documents
      const allowedTypes = [
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/json',
        'application/javascript',
        'application/typescript',
        'text/html',
        'text/css',
        'text/xml'
      ];
      
      if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} is not supported`), false);
      }
    }
  });

  // Auth middleware
  await setupAuth(app);

  // Marketing website routes (static HTML)
  const marketingHTML = (title: string, description: string, content: string, canonical?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | AgentFlow - No-Code AI Agent Builder</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="AI agent builder, no-code, automation, workflow, LangGraph, multi-agent">
    ${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title} | AgentFlow">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://agentflow.replit.app${canonical || ''}">
    <meta property="og:image" content="https://agentflow.replit.app/og-image.png">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title} | AgentFlow">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="https://agentflow.replit.app/og-image.png">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              border: "hsl(214.3 31.8% 91.4%)",
              input: "hsl(214.3 31.8% 91.4%)",
              ring: "hsl(222.2 84% 4.9%)",
              background: "hsl(0 0% 100%)",
              foreground: "hsl(222.2 84% 4.9%)",
              primary: {
                DEFAULT: "hsl(222.2 47.4% 11.2%)",
                foreground: "hsl(210 40% 98%)",
              },
              secondary: {
                DEFAULT: "hsl(210 40% 94%)",
                foreground: "hsl(222.2 84% 4.9%)",
              },
              accent: {
                DEFAULT: "hsl(210 40% 94%)",
                foreground: "hsl(222.2 84% 4.9%)",
              },
              muted: {
                DEFAULT: "hsl(210 40% 96%)",
                foreground: "hsl(215.4 16.3% 46.9%)",
              },
              card: {
                DEFAULT: "hsl(0 0% 100%)",
                foreground: "hsl(222.2 84% 4.9%)",
              },
            }
          }
        },
        darkMode: "class",
      }
    </script>
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    
    <!-- JSON-LD Schema -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "AgentFlow",
      "description": "No-code AI agent builder platform with LangGraph execution engine",
      "url": "https://agentflow.replit.app",
      "logo": "https://agentflow.replit.app/logo.png",
      "sameAs": []
    }
    </script>
</head>
<body class="bg-background text-foreground">
    ${content}
    
    <script>
      // Initialize Lucide icons
      lucide.createIcons();
      
      // Smooth scrolling for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
          });
        });
      });
    </script>
</body>
</html>`;

  // Landing Page
  app.get('/', (req: any, res) => {
    // Redirect to app if authenticated
    if (req.user) {
      return res.redirect('/app');
    }
    
    const content = `
      <!-- Header -->
      <header class="bg-white/95 backdrop-blur-md border-b border-border/10 sticky top-0 z-50 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <i data-lucide="zap" class="w-5 h-5 text-white"></i>
              </div>
              <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AgentFlow</span>
            </div>
            
            <nav class="hidden md:flex items-center space-x-8">
              <a href="#features" class="text-gray-600 hover:text-gray-900 transition-colors font-medium">Features</a>
              <a href="/pricing" class="text-gray-600 hover:text-gray-900 transition-colors font-medium">Pricing</a>
              <a href="#demo" class="text-gray-600 hover:text-gray-900 transition-colors font-medium">Demo</a>
              <a href="/contact" class="text-gray-600 hover:text-gray-900 transition-colors font-medium">Contact</a>
            </nav>
            
            <div class="flex items-center space-x-4">
              <a href="/api/auth/login" class="text-gray-600 hover:text-gray-900 transition-colors font-medium">Sign In</a>
              <a href="/api/auth/login?screen_hint=signup" class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300 font-semibold">Get Started Free</a>
            </div>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
        <!-- Background decoration -->
        <div class="absolute inset-0">
          <div class="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div class="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style="animation-delay: 2s;"></div>
          <div class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style="animation-delay: 4s;"></div>
        </div>
        
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <!-- Main headline -->
          <div class="mb-8">
            <div class="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full border border-blue-200 mb-6">
              <i data-lucide="sparkles" class="w-4 h-4 text-blue-600 mr-2"></i>
              <span class="text-blue-700 text-sm font-semibold">Meet your first AI workforce</span>
            </div>
            <h1 class="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Build <span class="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">AI Agents</span><br>
              <span class="text-gray-700">in 30 seconds</span>
            </h1>
          </div>
          
          <p class="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            The visual no-code platform for building multi-agent AI workflows. 
            <br class="hidden md:block">
            Drag, drop, deploy – no coding required.
          </p>
          
          <div class="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <a href="/api/auth/login?screen_hint=signup" class="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <span class="relative z-10 flex items-center justify-center">
                <i data-lucide="play" class="w-5 h-5 mr-2"></i>
                Start Building Free
              </span>
              <div class="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </a>
            <a href="#demo" class="group border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-gray-400 hover:shadow-lg transition-all duration-300 flex items-center justify-center">
              <i data-lucide="video" class="w-5 h-5 mr-2"></i>
              Watch Demo
            </a>
          </div>
          
          <!-- Visual Demo Preview -->
          <div class="relative mx-auto max-w-5xl">
            <div class="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center">
                <div class="flex space-x-2">
                  <div class="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div class="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div class="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div class="flex-1 text-center">
                  <span class="text-gray-600 font-medium">AgentFlow Builder</span>
                </div>
              </div>
              <div class="p-8 min-h-96 bg-gradient-to-br from-blue-50 to-purple-50 relative">
                <!-- Workflow visualization -->
                <div class="flex items-center justify-center space-x-8 mb-8">
                  <div class="bg-white p-4 rounded-xl shadow-lg border-2 border-blue-200">
                    <i data-lucide="mail" class="w-8 h-8 text-blue-600"></i>
                  </div>
                  <div class="flex-1 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 relative">
                    <div class="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-purple-300 border-y-4 border-y-transparent"></div>
                  </div>
                  <div class="bg-white p-4 rounded-xl shadow-lg border-2 border-purple-200">
                    <i data-lucide="brain" class="w-8 h-8 text-purple-600"></i>
                  </div>
                  <div class="flex-1 h-0.5 bg-gradient-to-r from-purple-300 to-pink-300 relative">
                    <div class="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-pink-300 border-y-4 border-y-transparent"></div>
                  </div>
                  <div class="bg-white p-4 rounded-xl shadow-lg border-2 border-pink-200">
                    <i data-lucide="send" class="w-8 h-8 text-pink-600"></i>
                  </div>
                </div>
                <div class="text-center">
                  <p class="text-gray-600 font-medium">Email → AI Agent → Action</p>
                  <p class="text-gray-500 text-sm mt-2">Build complex workflows visually</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <div class="inline-flex items-center px-4 py-2 bg-green-50 rounded-full border border-green-200 mb-6">
              <i data-lucide="trending-up" class="w-4 h-4 text-green-600 mr-2"></i>
              <span class="text-green-700 text-sm font-semibold">Join 10,000+ teams building with AI</span>
            </div>
          </div>
          
          <div class="grid md:grid-cols-4 gap-8 mb-20">
            <div class="text-center">
              <div class="text-4xl md:text-5xl font-bold text-gray-900 mb-2">30s</div>
              <div class="text-gray-600 font-medium">Setup Time</div>
            </div>
            <div class="text-center">
              <div class="text-4xl md:text-5xl font-bold text-gray-900 mb-2">3,000+</div>
              <div class="text-gray-600 font-medium">Integrations</div>
            </div>
            <div class="text-center">
              <div class="text-4xl md:text-5xl font-bold text-gray-900 mb-2">99.9%</div>
              <div class="text-gray-600 font-medium">Uptime</div>
            </div>
            <div class="text-center">
              <div class="text-4xl md:text-5xl font-bold text-gray-900 mb-2">24/7</div>
              <div class="text-gray-600 font-medium">AI Workforce</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Your AI Workforce, Simplified</h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
              From simple automations to complex multi-agent orchestrations, AgentFlow makes AI accessible to everyone.
            </p>
          </div>
          
          <!-- Feature Grid -->
          <div class="grid lg:grid-cols-3 gap-8 mb-20">
            <div class="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div class="relative z-10">
                <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <i data-lucide="mouse-pointer-click" class="w-7 h-7 text-white"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-4">Drag & Drop Builder</h3>
                <p class="text-gray-600">Design complex workflows visually. Connect agents, tools, and data sources with simple drag-and-drop.</p>
              </div>
            </div>
            
            <div class="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div class="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div class="relative z-10">
                <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <i data-lucide="zap" class="w-7 h-7 text-white"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-4">LangGraph Powered</h3>
                <p class="text-gray-600">Enterprise-grade execution engine with built-in reliability, scalability, and full observability.</p>
              </div>
            </div>
            
            <div class="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div class="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div class="relative z-10">
                <div class="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                  <i data-lucide="puzzle" class="w-7 h-7 text-white"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-4">3,000+ Integrations</h3>
                <p class="text-gray-600">Connect to every tool in your stack. Notion, Slack, OpenAI, Salesforce, and thousands more.</p>
              </div>
            </div>
            
            <div class="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div class="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div class="relative z-10">
                <div class="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
                  <i data-lucide="database" class="w-7 h-7 text-white"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-4">Smart Knowledge Base</h3>
                <p class="text-gray-600">Upload documents, scrape websites. Your AI agents have instant access to all your knowledge.</p>
              </div>
            </div>
            
            <div class="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div class="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div class="relative z-10">
                <div class="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <i data-lucide="activity" class="w-7 h-7 text-white"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-4">Real-time Monitoring</h3>
                <p class="text-gray-600">Watch your agents work in real-time. Full execution logs, performance metrics, and debugging.</p>
              </div>
            </div>
            
            <div class="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div class="absolute inset-0 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div class="relative z-10">
                <div class="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                  <i data-lucide="template" class="w-7 h-7 text-white"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-4">Ready-made Templates</h3>
                <p class="text-gray-600">Start in seconds with 60+ pre-built workflows for sales, marketing, support, and operations.</p>
              </div>
            </div>
          </div>
          
          <!-- Interactive Demo Section -->
          <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center text-white relative overflow-hidden" id="demo">
            <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
            <div class="relative z-10">
              <h2 class="text-3xl md:text-4xl font-bold mb-6">See AgentFlow in Action</h2>
              <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Watch how Fortune 500 companies are using AgentFlow to automate their most complex workflows</p>
              <a href="/api/auth/login?screen_hint=signup" class="inline-flex items-center bg-white text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-colors">
                <i data-lucide="play" class="w-5 h-5 mr-2"></i>
                Try AgentFlow Now
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Social Proof Section -->
      <section class="py-20 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Trusted by Forward-Thinking Teams</h2>
            <p class="text-xl text-gray-600">Join thousands of companies automating their workflows with AgentFlow</p>
          </div>
          
          <!-- Customer logos -->
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-center opacity-60">
            <div class="flex items-center justify-center">
              <div class="text-2xl font-bold text-gray-400">TechCorp</div>
            </div>
            <div class="flex items-center justify-center">
              <div class="text-2xl font-bold text-gray-400">InnovateLab</div>
            </div>
            <div class="flex items-center justify-center">
              <div class="text-2xl font-bold text-gray-400">DataFlow Inc</div>
            </div>
            <div class="flex items-center justify-center">
              <div class="text-2xl font-bold text-gray-400">SmartOps</div>
            </div>
            <div class="flex items-center justify-center">
              <div class="text-2xl font-bold text-gray-400">CloudTech</div>
            </div>
            <div class="flex items-center justify-center">
              <div class="text-2xl font-bold text-gray-400">AI Dynamics</div>
            </div>
          </div>
          
          <!-- Testimonials -->
          <div class="grid md:grid-cols-3 gap-8 mt-20">
            <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div class="flex items-center mb-4">
                <div class="flex text-yellow-400">
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                </div>
              </div>
              <p class="text-gray-700 mb-6">"AgentFlow saved our team 30+ hours per week. The visual builder made it incredibly easy to automate our customer onboarding process."</p>
              <div class="flex items-center">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-4">
                  <span class="text-white font-semibold">SK</span>
                </div>
                <div>
                  <div class="font-semibold text-gray-900">Sarah Kim</div>
                  <div class="text-gray-600 text-sm">Operations Manager</div>
                </div>
              </div>
            </div>
            
            <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div class="flex items-center mb-4">
                <div class="flex text-yellow-400">
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                </div>
              </div>
              <p class="text-gray-700 mb-6">"The multi-agent capabilities are game-changing. We built a complex sales pipeline automation that handles everything from lead scoring to follow-ups."</p>
              <div class="flex items-center">
                <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center mr-4">
                  <span class="text-white font-semibold">MR</span>
                </div>
                <div>
                  <div class="font-semibold text-gray-900">Michael Rodriguez</div>
                  <div class="text-gray-600 text-sm">Sales Director</div>
                </div>
              </div>
            </div>
            
            <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div class="flex items-center mb-4">
                <div class="flex text-yellow-400">
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                  <i data-lucide="star" class="w-5 h-5 fill-current"></i>
                </div>
              </div>
              <p class="text-gray-700 mb-6">"Finally, an AI platform that doesn't require a PhD to use. Our marketing team built their first agent in minutes, not months."</p>
              <div class="flex items-center">
                <div class="w-10 h-10 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center mr-4">
                  <span class="text-white font-semibold">EM</span>
                </div>
                <div>
                  <div class="font-semibold text-gray-900">Emily Martinez</div>
                  <div class="text-gray-600 text-sm">Marketing Lead</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Final CTA Section -->
      <section class="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 relative overflow-hidden">
        <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="20" cy="20" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 class="text-4xl md:text-5xl font-bold mb-6">Ready to Build Your AI Workforce?</h2>
          <p class="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
            Join thousands of teams using AgentFlow to automate workflows,<br class="hidden md:block">
            boost productivity, and focus on what matters most.
          </p>
          
          <div class="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <a href="/api/auth/login?screen_hint=signup" class="group bg-white text-gray-900 px-10 py-5 rounded-xl text-lg font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl">
              <span class="flex items-center justify-center">
                <i data-lucide="rocket" class="w-6 h-6 mr-2"></i>
                Start Building for Free
              </span>
            </a>
            <a href="/contact" class="border-2 border-white/30 text-white px-10 py-5 rounded-xl text-lg font-bold hover:border-white/60 hover:bg-white/10 transition-all duration-300">
              Talk to Sales
            </a>
          </div>
          
          <div class="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 text-gray-400">
            <div class="flex items-center">
              <i data-lucide="check" class="w-5 h-5 mr-2 text-green-400"></i>
              <span>Free forever plan</span>
            </div>
            <div class="flex items-center">
              <i data-lucide="check" class="w-5 h-5 mr-2 text-green-400"></i>
              <span>30-second setup</span>
            </div>
            <div class="flex items-center">
              <i data-lucide="check" class="w-5 h-5 mr-2 text-green-400"></i>
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-muted py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-4 gap-8">
            <div>
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <i data-lucide="zap" class="w-5 h-5 text-white"></i>
                </div>
                <span class="text-xl font-bold text-primary">AgentFlow</span>
              </div>
              <p class="text-muted-foreground">
                The no-code AI agent builder platform that makes automation accessible to everyone.
              </p>
            </div>
            
            <div>
              <h4 class="font-semibold mb-4">Product</h4>
              <ul class="space-y-2 text-muted-foreground">
                <li><a href="/features" class="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="/pricing" class="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="/templates" class="hover:text-foreground transition-colors">Templates</a></li>
                <li><a href="/integrations" class="hover:text-foreground transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-semibold mb-4">Company</h4>
              <ul class="space-y-2 text-muted-foreground">
                <li><a href="/about" class="hover:text-foreground transition-colors">About</a></li>
                <li><a href="/contact" class="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="/privacy" class="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="/terms" class="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-semibold mb-4">Support</h4>
              <ul class="space-y-2 text-muted-foreground">
                <li><a href="/contact" class="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="/contact" class="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="/contact" class="hover:text-foreground transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          
          <div class="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 AgentFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    `;
    
    res.send(marketingHTML(
      'Home', 
      'Build powerful AI agents without code. AgentFlow is the comprehensive no-code platform for creating, orchestrating, and deploying multi-agent AI workflows.',
      content,
      '/'
    ));
  });

  // SEO files
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /app/
Disallow: /api/

Sitemap: https://agentflow.replit.app/sitemap.xml`);
  });

  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://agentflow.replit.app/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://agentflow.replit.app/features</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://agentflow.replit.app/pricing</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://agentflow.replit.app/about</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://agentflow.replit.app/contact</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.6</priority>
  </url>
</urlset>`);
  });

  // Pricing Page
  app.get('/pricing', (req: any, res) => {
    const content = `
      <!-- Header -->
      <header class="bg-white border-b border-border sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i data-lucide="zap" class="w-5 h-5 text-white"></i>
              </div>
              <span class="text-xl font-bold text-primary">AgentFlow</span>
            </div>
            
            <nav class="hidden md:flex items-center space-x-8">
              <a href="/" class="text-muted-foreground hover:text-foreground transition-colors">Home</a>
              <a href="/#features" class="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="/about" class="text-muted-foreground hover:text-foreground transition-colors">About</a>
              <a href="/contact" class="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </nav>
            
            <div class="flex items-center space-x-4">
              <a href="/api/auth/login" class="text-muted-foreground hover:text-foreground transition-colors">Sign In</a>
              <a href="/api/auth/login?screen_hint=signup" class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">Get Started</a>
            </div>
          </div>
        </div>
      </header>

      <!-- Pricing Hero -->
      <section class="py-20 bg-gradient-to-br from-primary/5 to-accent/10">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-5xl font-bold text-foreground mb-6">Simple, Transparent Pricing</h1>
          <p class="text-xl text-muted-foreground mb-8">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      <!-- Pricing Cards -->
      <section class="py-20 -mt-10">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-3 gap-8">
            <!-- Free Tier -->
            <div class="bg-card p-8 rounded-xl border border-border hover:shadow-lg transition-shadow">
              <div class="text-center mb-8">
                <h3 class="text-2xl font-bold mb-2">Free</h3>
                <div class="text-4xl font-bold mb-2">$0</div>
                <div class="text-muted-foreground">per month</div>
              </div>
              <ul class="space-y-4 mb-8">
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  Up to 3 agents
                </li>
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  5 flows per project
                </li>
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  100 flow executions/month
                </li>
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  Basic integrations
                </li>
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  Community support
                </li>
              </ul>
              <a href="/api/auth/login?screen_hint=signup" class="w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors block text-center">
                Get Started Free
              </a>
            </div>

            <!-- Pro Tier -->
            <div class="bg-card p-8 rounded-xl border-2 border-primary hover:shadow-xl transition-shadow relative">
              <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div class="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              </div>
              <div class="text-center mb-8">
                <h3 class="text-2xl font-bold mb-2">Pro</h3>
                <div class="text-4xl font-bold mb-2">$29</div>
                <div class="text-muted-foreground">per month</div>
              </div>
              <ul class="space-y-4 mb-8">
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  Unlimited agents
                </li>
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  Unlimited flows
                </li>
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  10,000 executions/month
                </li>
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  All integrations
                </li>
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  Advanced analytics
                </li>
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  Priority support
                </li>
              </ul>
              <a href="/api/auth/login?screen_hint=signup" class="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors block text-center">
                Start Pro Trial
              </a>
            </div>

            <!-- Enterprise Tier -->
            <div class="bg-card p-8 rounded-xl border border-border hover:shadow-lg transition-shadow">
              <div class="text-center mb-8">
                <h3 class="text-2xl font-bold mb-2">Enterprise</h3>
                <div class="text-4xl font-bold mb-2">Custom</div>
                <div class="text-muted-foreground">contact us</div>
              </div>
              <ul class="space-y-4 mb-8">
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  Everything in Pro
                </li>
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  Unlimited executions
                </li>
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  Custom integrations
                </li>
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  Dedicated support
                </li>
                <li class="flex items-center">
                  <i data-lucide="check" class="w-5 h-5 text-primary mr-3"></i>
                  SLA & security audit
                </li>
              </ul>
              <a href="/contact" class="w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors block text-center">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="py-20 bg-muted/30">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div class="space-y-6">
            <div class="bg-card p-6 rounded-xl border border-border">
              <h3 class="text-xl font-semibold mb-3">What's included in the free plan?</h3>
              <p class="text-muted-foreground">The free plan includes up to 3 AI agents, 5 flows per project, 100 flow executions per month, and access to basic integrations with community support.</p>
            </div>
            <div class="bg-card p-6 rounded-xl border border-border">
              <h3 class="text-xl font-semibold mb-3">Can I upgrade or downgrade at any time?</h3>
              <p class="text-muted-foreground">Yes! You can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing period.</p>
            </div>
            <div class="bg-card p-6 rounded-xl border border-border">
              <h3 class="text-xl font-semibold mb-3">What payment methods do you accept?</h3>
              <p class="text-muted-foreground">We accept all major credit cards and offer invoicing for annual enterprise plans.</p>
            </div>
            <div class="bg-card p-6 rounded-xl border border-border">
              <h3 class="text-xl font-semibold mb-3">Is there a free trial for paid plans?</h3>
              <p class="text-muted-foreground">Yes! Pro plan comes with a 14-day free trial. No credit card required to start.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-muted py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-4 gap-8">
            <div>
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <i data-lucide="zap" class="w-5 h-5 text-white"></i>
                </div>
                <span class="text-xl font-bold text-primary">AgentFlow</span>
              </div>
              <p class="text-muted-foreground">
                The no-code AI agent builder platform that makes automation accessible to everyone.
              </p>
            </div>
            
            <div>
              <h4 class="font-semibold mb-4">Product</h4>
              <ul class="space-y-2 text-muted-foreground">
                <li><a href="/#features" class="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="/pricing" class="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="/app/templates" class="hover:text-foreground transition-colors">Templates</a></li>
                <li><a href="/app/integrations" class="hover:text-foreground transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-semibold mb-4">Company</h4>
              <ul class="space-y-2 text-muted-foreground">
                <li><a href="/about" class="hover:text-foreground transition-colors">About</a></li>
                <li><a href="/contact" class="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="/privacy" class="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="/terms" class="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-semibold mb-4">Support</h4>
              <ul class="space-y-2 text-muted-foreground">
                <li><a href="/contact" class="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="/contact" class="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="/contact" class="hover:text-foreground transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          
          <div class="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 AgentFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    `;
    
    res.send(marketingHTML(
      'Pricing', 
      'Simple, transparent pricing for AgentFlow AI agent builder. Start free with up to 3 agents, upgrade to Pro for unlimited agents and advanced features.',
      content,
      '/pricing'
    ));
  });

  // Contact Page  
  app.get('/contact', (req: any, res) => {
    const content = `
      <!-- Header -->
      <header class="bg-white border-b border-border sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i data-lucide="zap" class="w-5 h-5 text-white"></i>
              </div>
              <span class="text-xl font-bold text-primary">AgentFlow</span>
            </div>
            
            <nav class="hidden md:flex items-center space-x-8">
              <a href="/" class="text-muted-foreground hover:text-foreground transition-colors">Home</a>
              <a href="/#features" class="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="/pricing" class="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="/about" class="text-muted-foreground hover:text-foreground transition-colors">About</a>
            </nav>
            
            <div class="flex items-center space-x-4">
              <a href="/api/auth/login" class="text-muted-foreground hover:text-foreground transition-colors">Sign In</a>
              <a href="/api/auth/login?screen_hint=signup" class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">Get Started</a>
            </div>
          </div>
        </div>
      </header>

      <!-- Contact Hero -->
      <section class="py-20 bg-gradient-to-br from-primary/5 to-accent/10">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-5xl font-bold text-foreground mb-6">Get in Touch</h1>
          <p class="text-xl text-muted-foreground mb-8">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      <!-- Contact Content -->
      <section class="py-20 -mt-10">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid lg:grid-cols-2 gap-12">
            <!-- Contact Info -->
            <div>
              <h2 class="text-3xl font-bold mb-8">Let's start a conversation</h2>
              <div class="space-y-6">
                <div class="flex items-start space-x-4">
                  <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <i data-lucide="mail" class="w-6 h-6 text-primary"></i>
                  </div>
                  <div>
                    <h3 class="text-xl font-semibold mb-2">Email us</h3>
                    <p class="text-muted-foreground mb-2">Get in touch for support or sales inquiries</p>
                    <a href="mailto:hello@agentflow.dev" class="text-primary hover:underline">hello@agentflow.dev</a>
                  </div>
                </div>
                
                <div class="flex items-start space-x-4">
                  <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <i data-lucide="message-circle" class="w-6 h-6 text-primary"></i>
                  </div>
                  <div>
                    <h3 class="text-xl font-semibold mb-2">Live Chat</h3>
                    <p class="text-muted-foreground mb-2">Chat with our team in real-time</p>
                    <a href="/api/auth/login" class="text-primary hover:underline">Available in-app</a>
                  </div>
                </div>
                
                <div class="flex items-start space-x-4">
                  <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <i data-lucide="phone" class="w-6 h-6 text-primary"></i>
                  </div>
                  <div>
                    <h3 class="text-xl font-semibold mb-2">Schedule a call</h3>
                    <p class="text-muted-foreground mb-2">Book a demo or consultation</p>
                    <a href="#" class="text-primary hover:underline">Book a meeting</a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact Form -->
            <div class="bg-card p-8 rounded-xl border border-border">
              <form class="space-y-6">
                <div class="grid md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">First Name</label>
                    <input type="text" class="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent">
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">Last Name</label>
                    <input type="text" class="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent">
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium mb-2">Email</label>
                  <input type="email" class="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                
                <div>
                  <label class="block text-sm font-medium mb-2">Subject</label>
                  <select class="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent">
                    <option>General Inquiry</option>
                    <option>Sales Question</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium mb-2">Message</label>
                  <textarea rows="4" class="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>
                </div>
                
                <button type="submit" class="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-muted py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-4 gap-8">
            <div>
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <i data-lucide="zap" class="w-5 h-5 text-white"></i>
                </div>
                <span class="text-xl font-bold text-primary">AgentFlow</span>
              </div>
              <p class="text-muted-foreground">
                The no-code AI agent builder platform that makes automation accessible to everyone.
              </p>
            </div>
            
            <div>
              <h4 class="font-semibold mb-4">Product</h4>
              <ul class="space-y-2 text-muted-foreground">
                <li><a href="/#features" class="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="/pricing" class="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="/app/templates" class="hover:text-foreground transition-colors">Templates</a></li>
                <li><a href="/app/integrations" class="hover:text-foreground transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-semibold mb-4">Company</h4>
              <ul class="space-y-2 text-muted-foreground">
                <li><a href="/about" class="hover:text-foreground transition-colors">About</a></li>
                <li><a href="/contact" class="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="/privacy" class="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="/terms" class="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-semibold mb-4">Support</h4>
              <ul class="space-y-2 text-muted-foreground">
                <li><a href="/contact" class="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="/contact" class="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="/contact" class="hover:text-foreground transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          
          <div class="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 AgentFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    `;
    
    res.send(marketingHTML(
      'Contact Us', 
      'Get in touch with the AgentFlow team. We\'re here to help with sales inquiries, technical support, and any questions about our AI agent builder platform.',
      content,
      '/contact'
    ));
  });

  // Serve SPA for /app routes
  app.get('/app*', (req: any, res) => {
    // This will be handled by the Vite middleware to serve the React SPA
    res.redirect('/app');
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const projectData = insertProjectSchema.parse({ ...req.body, userId });
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Agent routes
  app.get('/api/projects/:projectId/agents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.projectId;
      
      // Validate project ownership
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Project access denied" });
      }
      
      const agents = await storage.getAgents(projectId);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.post('/api/projects/:projectId/agents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.projectId;
      
      // Validate project ownership
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Project access denied" });
      }
      
      const agentData = insertAgentSchema.parse({ ...req.body, projectId });
      const agent = await storage.createAgent(agentData);
      res.json(agent);
    } catch (error) {
      console.error("Error creating agent:", error);
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  app.put('/api/agents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.id;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const updates = insertAgentSchema.partial().parse(req.body);
      const updatedAgent = await storage.updateAgent(agentId, updates);
      res.json(updatedAgent);
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  app.get('/api/agents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.id;
      
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Validate agent ownership through project
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  // Knowledge Base routes
  app.get('/api/agents/:agentId/knowledge-bases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.agentId;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const knowledgeBases = await storage.getKnowledgeBases(agentId);
      res.json(knowledgeBases);
    } catch (error) {
      console.error("Error fetching knowledge bases:", error);
      res.status(500).json({ message: "Failed to fetch knowledge bases" });
    }
  });

  app.post('/api/agents/:agentId/knowledge-bases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.agentId;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const knowledgeBaseData = insertKnowledgeBaseSchema.parse({ 
        ...req.body, 
        agentId 
      });
      const knowledgeBase = await storage.createKnowledgeBase(knowledgeBaseData);
      res.json(knowledgeBase);
    } catch (error) {
      console.error("Error creating knowledge base:", error);
      res.status(500).json({ message: "Failed to create knowledge base" });
    }
  });

  app.put('/api/knowledge-bases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const knowledgeBaseId = req.params.id;
      
      // Validate knowledge base ownership through agent and project
      const knowledgeBase = await storage.getKnowledgeBase(knowledgeBaseId);
      if (!knowledgeBase) {
        return res.status(404).json({ message: "Knowledge base not found" });
      }
      
      const agent = await storage.getAgent(knowledgeBase.agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Knowledge base access denied" });
      }
      
      const updates = insertKnowledgeBaseSchema.partial().parse(req.body);
      const updatedKnowledgeBase = await storage.updateKnowledgeBase(knowledgeBaseId, updates);
      res.json(updatedKnowledgeBase);
    } catch (error) {
      console.error("Error updating knowledge base:", error);
      res.status(500).json({ message: "Failed to update knowledge base" });
    }
  });

  app.delete('/api/knowledge-bases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const knowledgeBaseId = req.params.id;
      
      // Validate knowledge base ownership through agent and project
      const knowledgeBase = await storage.getKnowledgeBase(knowledgeBaseId);
      if (!knowledgeBase) {
        return res.status(404).json({ message: "Knowledge base not found" });
      }
      
      const agent = await storage.getAgent(knowledgeBase.agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Knowledge base access denied" });
      }
      
      await storage.deleteKnowledgeBase(knowledgeBaseId);
      res.json({ message: "Knowledge base deleted successfully" });
    } catch (error) {
      console.error("Error deleting knowledge base:", error);
      res.status(500).json({ message: "Failed to delete knowledge base" });
    }
  });

  // Knowledge Item routes
  app.get('/api/knowledge-bases/:knowledgeBaseId/items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const knowledgeBaseId = req.params.knowledgeBaseId;
      
      // Validate knowledge base ownership through agent and project
      const knowledgeBase = await storage.getKnowledgeBase(knowledgeBaseId);
      if (!knowledgeBase) {
        return res.status(404).json({ message: "Knowledge base not found" });
      }
      
      const agent = await storage.getAgent(knowledgeBase.agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Knowledge base access denied" });
      }
      
      const items = await storage.getKnowledgeItems(knowledgeBaseId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching knowledge items:", error);
      res.status(500).json({ message: "Failed to fetch knowledge items" });
    }
  });

  app.post('/api/knowledge-bases/:knowledgeBaseId/items', isAuthenticated, async (req, res) => {
    try {
      const itemData = insertKnowledgeItemSchema.parse({
        ...req.body,
        knowledgeBaseId: req.params.knowledgeBaseId
      });
      const item = await storage.createKnowledgeItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating knowledge item:", error);
      res.status(500).json({ message: "Failed to create knowledge item" });
    }
  });

  app.put('/api/knowledge-items/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertKnowledgeItemSchema.partial().parse(req.body);
      const item = await storage.updateKnowledgeItem(req.params.id, updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating knowledge item:", error);
      res.status(500).json({ message: "Failed to update knowledge item" });
    }
  });

  app.delete('/api/knowledge-items/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteKnowledgeItem(req.params.id);
      res.json({ message: "Knowledge item deleted successfully" });
    } catch (error) {
      console.error("Error deleting knowledge item:", error);
      res.status(500).json({ message: "Failed to delete knowledge item" });
    }
  });

  // File upload and processing route
  app.post('/api/knowledge-bases/:knowledgeBaseId/upload', 
    isAuthenticated, 
    upload.single('file'), 
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const knowledgeBaseId = req.params.knowledgeBaseId;
        
        // Validate knowledge base ownership through agent and project
        const knowledgeBase = await storage.getKnowledgeBase(knowledgeBaseId);
        if (!knowledgeBase) {
          return res.status(404).json({ message: "Knowledge base not found" });
        }
        
        const agent = await storage.getAgent(knowledgeBase.agentId);
        if (!agent) {
          return res.status(404).json({ message: "Agent not found" });
        }
        
        const project = await storage.getProject(agent.projectId);
        if (!project || project.userId !== userId) {
          return res.status(403).json({ message: "Knowledge base access denied" });
        }
        
        // Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        // Process the uploaded file with embeddings
        try {
          console.log(`🔄 Starting file processing for ${req.file.originalname}...`);
          
          const result = await EmbeddingService.processUploadedFile(
            knowledgeBaseId,
            req.file
          );
          
          console.log(`✅ File processing completed: ${result.itemCount} items, ${result.embeddingsCount} embeddings`);
          
          res.json({
            message: "File uploaded and processed successfully",
            totalChunks: result.totalChunks,
            embeddingsCount: result.embeddingsCount,
            itemCount: result.itemCount,
            filename: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype
          });
        } catch (processingError) {
          console.error("Error processing file:", processingError);
          
          // Create a basic knowledge item as fallback
          const fallbackItemData = insertKnowledgeItemSchema.parse({
            knowledgeBaseId,
            type: 'file',
            title: req.file.originalname,
            content: EmbeddingService.extractTextFromFile(
              req.file.buffer,
              req.file.mimetype,
              req.file.originalname
            ),
            metadata: {
              mimeType: req.file.mimetype,
              filename: req.file.originalname,
              uploadedAt: new Date().toISOString(),
              size: req.file.size,
              processingError: processingError.message,
              processingFailed: true
            }
          });
          
          const fallbackItem = await storage.createKnowledgeItem(fallbackItemData);
          
          res.json({
            message: "File uploaded but processing failed - saved as basic item",
            knowledgeItems: [fallbackItem],
            embeddings: 0,
            totalChunks: 0,
            filename: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
            warning: "Embedding generation failed",
            error: processingError.message
          });
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ 
          message: "Failed to upload file",
          error: error.message 
        });
      }
    }
  );

  // Embedding search route
  app.post('/api/knowledge-bases/:knowledgeBaseId/search', isAuthenticated, async (req, res) => {
    try {
      const { query, limit = 10 } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // TODO: Implement proper vector search
      // For now, return empty results
      const results = await storage.searchEmbeddings(query, limit);
      res.json(results);
    } catch (error) {
      console.error("Error searching knowledge base:", error);
      res.status(500).json({ message: "Failed to search knowledge base" });
    }
  });

  // Data Source routes (Data Fabric)
  app.get('/api/projects/:projectId/data-sources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.projectId;
      
      // Validate project ownership
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Project access denied" });
      }
      
      const dataSources = await storage.getDataSources(projectId);
      res.json(dataSources);
    } catch (error) {
      console.error("Error fetching data sources:", error);
      res.status(500).json({ message: "Failed to fetch data sources" });
    }
  });

  app.post('/api/projects/:projectId/data-sources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const projectId = req.params.projectId;
      
      // Validate project ownership
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Project access denied" });
      }
      
      const dataSourceData = insertDataSourceSchema.parse({ 
        ...req.body, 
        projectId 
      });
      const dataSource = await storage.createDataSource(dataSourceData);
      res.json(dataSource);
    } catch (error) {
      console.error("Error creating data source:", error);
      res.status(500).json({ message: "Failed to create data source" });
    }
  });

  app.put('/api/data-sources/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const dataSourceId = req.params.id;
      
      // Validate data source ownership through project
      const dataSource = await storage.getDataSource(dataSourceId);
      if (!dataSource) {
        return res.status(404).json({ message: "Data source not found" });
      }
      
      const project = await storage.getProject(dataSource.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Data source access denied" });
      }
      
      const updates = insertDataSourceSchema.partial().parse(req.body);
      const updatedDataSource = await storage.updateDataSource(dataSourceId, updates);
      res.json(updatedDataSource);
    } catch (error) {
      console.error("Error updating data source:", error);
      res.status(500).json({ message: "Failed to update data source" });
    }
  });

  app.delete('/api/data-sources/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const dataSourceId = req.params.id;
      
      // Validate data source ownership through project
      const dataSource = await storage.getDataSource(dataSourceId);
      if (!dataSource) {
        return res.status(404).json({ message: "Data source not found" });
      }
      
      const project = await storage.getProject(dataSource.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Data source access denied" });
      }
      
      await storage.deleteDataSource(dataSourceId);
      res.json({ message: "Data source deleted successfully" });
    } catch (error) {
      console.error("Error deleting data source:", error);
      res.status(500).json({ message: "Failed to delete data source" });
    }
  });

  // Data Connection routes
  app.get('/api/agents/:agentId/data-connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.agentId;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const connections = await storage.getDataConnections(agentId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching data connections:", error);
      res.status(500).json({ message: "Failed to fetch data connections" });
    }
  });

  app.post('/api/agents/:agentId/data-connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.agentId;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const connectionData = insertDataConnectionSchema.parse({
        ...req.body,
        agentId
      });
      const connection = await storage.createDataConnection(connectionData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating data connection:", error);
      res.status(500).json({ message: "Failed to create data connection" });
    }
  });

  app.put('/api/data-connections/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertDataConnectionSchema.partial().parse(req.body);
      const connection = await storage.updateDataConnection(req.params.id, updates);
      res.json(connection);
    } catch (error) {
      console.error("Error updating data connection:", error);
      res.status(500).json({ message: "Failed to update data connection" });
    }
  });

  app.delete('/api/data-connections/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteDataConnection(req.params.id);
      res.json({ message: "Data connection deleted successfully" });
    } catch (error) {
      console.error("Error deleting data connection:", error);
      res.status(500).json({ message: "Failed to delete data connection" });
    }
  });

  // Autonomous Triggers routes
  app.get('/api/agents/:agentId/triggers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.agentId;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const triggers = await storage.getTriggers(agentId);
      res.json(triggers);
    } catch (error) {
      console.error("Error fetching triggers:", error);
      res.status(500).json({ message: "Failed to fetch triggers" });
    }
  });

  app.post('/api/agents/:agentId/triggers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const agentId = req.params.agentId;
      
      // Validate agent ownership through project
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      const project = await storage.getProject(agent.projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Agent access denied" });
      }
      
      const triggerData = insertAutonomousTriggerSchema.parse({
        ...req.body,
        agentId
      });
      const trigger = await storage.createTrigger(triggerData);
      res.json(trigger);
    } catch (error) {
      console.error("Error creating trigger:", error);
      res.status(500).json({ message: "Failed to create trigger" });
    }
  });

  app.put('/api/triggers/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertAutonomousTriggerSchema.partial().parse(req.body);
      const trigger = await storage.updateTrigger(req.params.id, updates);
      res.json(trigger);
    } catch (error) {
      console.error("Error updating trigger:", error);
      res.status(500).json({ message: "Failed to update trigger" });
    }
  });

  app.delete('/api/triggers/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTrigger(req.params.id);
      res.json({ message: "Trigger deleted successfully" });
    } catch (error) {
      console.error("Error deleting trigger:", error);
      res.status(500).json({ message: "Failed to delete trigger" });
    }
  });

  // Trigger execution endpoint
  app.post('/api/triggers/:id/execute', isAuthenticated, async (req, res) => {
    try {
      const trigger = await storage.getTrigger(req.params.id);
      if (!trigger) {
        return res.status(404).json({ message: "Trigger not found" });
      }

      // TODO: Implement trigger execution logic
      // This would integrate with the execution engine
      
      const eventData = insertTriggerEventSchema.parse({
        triggerId: req.params.id,
        eventType: 'manual',
        payload: req.body,
        status: 'triggered'
      });
      
      const event = await storage.createTriggerEvent(eventData);
      res.json({ message: "Trigger executed successfully", event });
    } catch (error) {
      console.error("Error executing trigger:", error);
      res.status(500).json({ message: "Failed to execute trigger" });
    }
  });

  // UI Components routes
  app.get('/api/agent-uis/:agentUiId/components', isAuthenticated, async (req, res) => {
    try {
      const components = await storage.getUiComponents(req.params.agentUiId);
      res.json(components);
    } catch (error) {
      console.error("Error fetching UI components:", error);
      res.status(500).json({ message: "Failed to fetch UI components" });
    }
  });

  app.post('/api/agent-uis/:agentUiId/components', isAuthenticated, async (req, res) => {
    try {
      const componentData = insertUiComponentSchema.parse({
        ...req.body,
        agentUiId: req.params.agentUiId
      });
      const component = await storage.createUiComponent(componentData);
      res.json(component);
    } catch (error) {
      console.error("Error creating UI component:", error);
      res.status(500).json({ message: "Failed to create UI component" });
    }
  });

  app.put('/api/ui-components/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertUiComponentSchema.partial().parse(req.body);
      const component = await storage.updateUiComponent(req.params.id, updates);
      res.json(component);
    } catch (error) {
      console.error("Error updating UI component:", error);
      res.status(500).json({ message: "Failed to update UI component" });
    }
  });

  app.delete('/api/ui-components/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteUiComponent(req.params.id);
      res.json({ message: "UI component deleted successfully" });
    } catch (error) {
      console.error("Error deleting UI component:", error);
      res.status(500).json({ message: "Failed to delete UI component" });
    }
  });

  // Tool routes
  app.get('/api/projects/:projectId/tools', isAuthenticated, async (req, res) => {
    try {
      const tools = await storage.getTools(req.params.projectId);
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ message: "Failed to fetch tools" });
    }
  });

  app.post('/api/projects/:projectId/tools', isAuthenticated, async (req, res) => {
    try {
      const toolData = insertToolSchema.parse({ ...req.body, projectId: req.params.projectId });
      const tool = await storage.createTool(toolData);
      res.json(tool);
    } catch (error) {
      console.error("Error creating tool:", error);
      res.status(500).json({ message: "Failed to create tool" });
    }
  });

  // Flow routes
  app.get('/api/projects/:projectId/flows', isAuthenticated, async (req, res) => {
    try {
      const flows = await storage.getFlows(req.params.projectId);
      res.json(flows);
    } catch (error) {
      console.error("Error fetching flows:", error);
      res.status(500).json({ message: "Failed to fetch flows" });
    }
  });

  app.post('/api/projects/:projectId/flows', isAuthenticated, async (req, res) => {
    try {
      const flowData = insertFlowSchema.parse({ ...req.body, projectId: req.params.projectId });
      const flow = await storage.createFlow(flowData);
      res.json(flow);
    } catch (error) {
      console.error("Error creating flow:", error);
      res.status(500).json({ message: "Failed to create flow" });
    }
  });

  app.get('/api/flows/:id', isAuthenticated, async (req, res) => {
    try {
      const flow = await storage.getFlow(req.params.id);
      if (!flow) {
        return res.status(404).json({ message: "Flow not found" });
      }
      res.json(flow);
    } catch (error) {
      console.error("Error fetching flow:", error);
      res.status(500).json({ message: "Failed to fetch flow" });
    }
  });

  app.get('/api/flows/:id/steps', isAuthenticated, async (req, res) => {
    try {
      const steps = await storage.getSteps(req.params.id);
      res.json(steps);
    } catch (error) {
      console.error("Error fetching steps:", error);
      res.status(500).json({ message: "Failed to fetch steps" });
    }
  });

  app.post('/api/flows/:id/steps', isAuthenticated, async (req, res) => {
    try {
      const stepData = insertStepSchema.parse({ 
        ...req.body, 
        flowId: req.params.id 
      });
      const step = await storage.createStep(stepData);
      res.json(step);
    } catch (error) {
      console.error("Error creating step:", error);
      res.status(500).json({ message: "Failed to create step" });
    }
  });

  app.put('/api/steps/:id', isAuthenticated, async (req, res) => {
    try {
      const step = await storage.updateStep(req.params.id, req.body);
      res.json(step);
    } catch (error) {
      console.error("Error updating step:", error);
      res.status(500).json({ message: "Failed to update step" });
    }
  });

  app.delete('/api/steps/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteStep(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting step:", error);
      res.status(500).json({ message: "Failed to delete step" });
    }
  });

  // Run routes
  app.post('/api/flows/:id/run', isAuthenticated, async (req, res) => {
    try {
      const runData = insertRunSchema.parse({
        flowId: req.params.id,
        sessionId: `run_${Date.now()}`,
        status: 'queued',
        input: req.body.input || {},
        context: {}
      });
      
      const run = await storage.createRun(runData);
      
      // Start execution asynchronously
      executionEngine.executeFlow(run.id).catch((error: unknown) => {
        console.error("Flow execution error:", error);
      });
      
      res.json(run);
    } catch (error) {
      console.error("Error starting run:", error);
      res.status(500).json({ message: "Failed to start run" });
    }
  });

  app.get('/api/runs/:id', isAuthenticated, async (req, res) => {
    try {
      const run = await storage.getRun(req.params.id);
      if (!run) {
        return res.status(404).json({ message: "Run not found" });
      }
      res.json(run);
    } catch (error) {
      console.error("Error fetching run:", error);
      res.status(500).json({ message: "Failed to fetch run" });
    }
  });

  app.get('/api/runs/:id/logs', isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getLogs(req.params.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // LangGraph execution routes
  app.post('/api/langgraph/test/meeting-actions', async (req, res) => {
    try {
      console.log('🚀 Starting LangGraph test execution...');
      
      const result = await langGraphEngine.testMeetingActionsFlow();
      
      console.log('✅ LangGraph test execution completed:', result.status);
      
      res.json({
        success: true,
        message: "LangGraph test execution completed",
        result
      });
    } catch (error) {
      console.error("❌ LangGraph test execution failed:", error);
      res.status(500).json({ 
        success: false,
        message: "LangGraph test execution failed", 
        error: (error as Error).message 
      });
    }
  });

  app.post('/api/langgraph/flows/:flowName/run', async (req, res) => {
    try {
      const { flowName } = req.params;
      const { input = {}, sessionId = `session_${Date.now()}` } = req.body;
      
      console.log(`🚀 Starting LangGraph execution for flow: ${flowName}`);
      
      const result = await langGraphEngine.executeFlowByName(flowName, sessionId, input);
      
      console.log(`✅ LangGraph execution completed for ${flowName}:`, result.status);
      
      res.json({
        success: true,
        message: `LangGraph execution completed for ${flowName}`,
        result
      });
    } catch (error) {
      console.error(`❌ LangGraph execution failed for flow:`, error);
      res.status(500).json({ 
        success: false,
        message: "LangGraph execution failed", 
        error: (error as Error).message 
      });
    }
  });

  // Test endpoints (development only)
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/test/embedding', isAuthenticated, async (req, res) => {
      try {
        const { text = "This is a test text for embedding generation." } = req.body;
        
        // Limit test text size
        if (text.length > 1000) {
          return res.status(400).json({ 
            success: false,
            message: "Test text too long (max 1000 characters)" 
          });
        }
        
        console.log('🧪 Testing embedding generation for text:', text.substring(0, 50) + '...');
        
        const { EmbeddingService } = await import('./embeddingService');
        const embedding = await EmbeddingService.generateEmbedding(text);
        
        console.log('✅ Successfully generated embedding, length:', embedding.length);
        
        res.json({
          success: true,
          message: "Embedding generated successfully",
          embeddingLength: embedding.length,
          textLength: text.length
        });
      } catch (error) {
        console.error("❌ Embedding generation test failed:", error);
        res.status(500).json({ 
          success: false,
          message: "Embedding generation failed", 
          error: (error as Error).message 
        });
      }
    });

    // Test RAG search endpoint (development only)
    app.post('/api/test/rag-search', isAuthenticated, async (req, res) => {
      try {
        const { 
          query = "What is AgentFlow?", 
          knowledgeBaseId = "1e92d15e-26f8-4f32-9a29-669de638f273",
          threshold = 0.3
        } = req.body;
        
        console.log(`🧪 Testing RAG search for query: "${query}"`);
        
        // First, check if the knowledge base exists
        const kb = await storage.getKnowledgeBase(knowledgeBaseId);
        console.log(`📋 Knowledge base exists: ${kb ? 'Yes' : 'No'}`, kb ? `(${kb.name})` : '');
        
        // Check how many knowledge items are in this knowledge base
        const knowledgeItems = await storage.getKnowledgeItems(knowledgeBaseId);
        console.log(`📄 Knowledge items in KB: ${knowledgeItems.length}`);
        
        // Check total embeddings across all knowledge items
        let totalEmbeddings = 0;
        for (const item of knowledgeItems) {
          const embeddings = await storage.getEmbeddings(item.id);
          totalEmbeddings += embeddings.length;
        }
        console.log(`🔢 Total embeddings: ${totalEmbeddings}`);
        
        const { EmbeddingService } = await import('./embeddingService');
        const results = await EmbeddingService.searchSimilar(knowledgeBaseId, query, 10, threshold);
        
        console.log(`✅ RAG search found ${results.length} results`);
        
        res.json({
          success: true,
          query,
          knowledgeBaseId,
          threshold,
          debug: {
            knowledgeBaseExists: !!kb,
            knowledgeBaseName: kb?.name,
            knowledgeItemsCount: knowledgeItems.length,
            totalEmbeddings
          },
          resultsCount: results.length,
          results: results.map(r => ({
            similarity: r.similarity,
            chunkText: r.chunkText.substring(0, 200) + '...',
            metadata: r.metadata
          }))
        });
      } catch (error) {
        console.error("❌ RAG search test failed:", error);
        res.status(500).json({ 
          success: false,
          message: "RAG search failed", 
          error: (error as Error).message 
        });
      }
    });

    // Test agent RAG integration endpoint (development only)
    app.post('/api/test/agent-rag', isAuthenticated, async (req, res) => {
      try {
        const { userMessage = "What is AgentFlow?", agentId } = req.body;
        
        console.log(`🧪 Testing agent RAG integration for query: "${userMessage}"`);
        
        // First, create a mock agent with knowledge base association if agentId not provided
        let testAgentId = agentId;
        if (!testAgentId) {
          // Use the existing knowledge base
          const knowledgeBaseId = "1e92d15e-26f8-4f32-9a29-669de638f273";
          
          // Create a mock agent data
          const mockAgent = {
            projectId: "b9882355-4895-4a2d-9efc-e0d80d8d30fc",
            name: "RAG Test Agent",
            description: "Test agent for RAG functionality",
            systemPrompt: "You are a helpful assistant that answers questions about AgentFlow using your knowledge base.",
            userTemplate: "{{input}}",
          };
          
          // Create the agent
          const agent = await storage.createAgent(mockAgent);
          testAgentId = agent.id;
          
          // Associate the knowledge base with the agent
          await storage.updateKnowledgeBase(knowledgeBaseId, { agentId: testAgentId });
          
          console.log(`🤖 Created test agent ${testAgentId} and associated with KB ${knowledgeBaseId}`);
        }
        
        // Test the RAG-enabled agent response generation
        const { generateAgentResponse } = await import('./openaiClient');
        const response = await generateAgentResponse(
          "You are a helpful assistant that answers questions about AgentFlow using your knowledge base.",
          userMessage,
          {},
          testAgentId
        );
        
        console.log(`✅ Generated agent response with RAG`);
        
        res.json({
          success: true,
          userMessage,
          agentId: testAgentId,
          response,
          message: "RAG integration test completed successfully"
        });
      } catch (error) {
        console.error("❌ Agent RAG test failed:", error);
        res.status(500).json({ 
          success: false,
          message: "Agent RAG test failed", 
          error: (error as Error).message 
        });
      }
    });
  }

  // Template routes
  app.get('/api/templates', async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Manual template seeding endpoint
  app.post('/api/templates/seed', async (req, res) => {
    try {
      console.log('🌱 Manual template seeding triggered...');
      const result = await seedAllTemplates();
      res.json({
        success: result.success,
        message: result.success ? 'Templates seeded successfully' : 'Template seeding failed',
        templates: result.templates || [],
        error: result.error || null
      });
    } catch (error) {
      console.error("Error seeding templates:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to seed templates", 
        error: error 
      });
    }
  });

  // Template instantiation route
  app.post('/api/templates/:templateId/instantiate', isAuthenticated, async (req: any, res) => {
    try {
      const { templateId } = req.params;
      const { projectId, name, description, config } = req.body;
      const userId = req.user.id;

      // Validate required parameters
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      // Get the template
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Validate project belongs to user
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== userId) {
        return res.status(403).json({ message: "Project access denied" });
      }

      // Extract template data
      const templateData = template.templateData as any;
      
      // Create the flow
      const flowName = name || `${template.name} - ${new Date().toLocaleDateString()}`;
      const flowDescription = description || template.description;
      
      const flowData = insertFlowSchema.parse({
        projectId,
        name: flowName,
        description: flowDescription,
        inputSchema: templateData.inputSchema,
        outputSchema: templateData.outputSchema,
      });

      const createdFlow = await storage.createFlow(flowData);

      // Create agents from template
      const agentMap = new Map<string, string>(); // template name -> database id
      for (const templateAgent of templateData.agents || []) {
        const agentData = insertAgentSchema.parse({
          projectId,
          name: templateAgent.name,
          description: templateAgent.description,
          systemPrompt: templateAgent.systemPrompt,
          userTemplate: templateAgent.userTemplate,
          fewShots: templateAgent.fewShots || null,
          inputSchema: templateAgent.inputSchema,
          outputSchema: templateAgent.outputSchema,
        });

        const createdAgent = await storage.createAgent(agentData);
        agentMap.set(templateAgent.name, createdAgent.id);
      }

      // Create tools from template
      const toolMap = new Map<string, string>(); // template name -> database id
      for (const templateTool of templateData.tools || []) {
        // Apply configuration overrides (like database_id for Notion)
        let toolSpec = { ...templateTool.spec };
        if (config && config.notion_database_id && templateTool.name === 'notion.create_tasks') {
          toolSpec.inputSchema.properties.database_id.default = config.notion_database_id;
        }

        const toolData = insertToolSchema.parse({
          projectId,
          name: templateTool.name,
          type: templateTool.type,
          spec: toolSpec,
        });

        const createdTool = await storage.createTool(toolData);
        toolMap.set(templateTool.name, createdTool.id);
      }

      // Create steps from template
      for (const templateStep of templateData.steps || []) {
        let refId: string;

        if (templateStep.kind === 'agent') {
          refId = agentMap.get(templateStep.name) || '';
        } else if (templateStep.kind === 'tool') {
          refId = toolMap.get(templateStep.name) || '';
        } else {
          throw new Error(`Unknown step kind: ${templateStep.kind}`);
        }

        if (!refId) {
          throw new Error(`Reference not found for step: ${templateStep.name}`);
        }

        // Apply step configuration
        let stepConfig = templateStep.config || {};
        if (config && config.export_target) {
          stepConfig.export_target = config.export_target;
        }

        const stepData = insertStepSchema.parse({
          flowId: createdFlow.id,
          idx: templateStep.idx,
          kind: templateStep.kind,
          refId,
          config: stepConfig,
        });

        await storage.createStep(stepData);
      }

      // Create secrets if needed
      if (templateData.secrets && config && config.secrets) {
        for (const secretTemplate of templateData.secrets) {
          if (config.secrets[secretTemplate.key]) {
            const secretData = insertSecretSchema.parse({
              projectId,
              key: secretTemplate.key,
              valueEnc: config.secrets[secretTemplate.key], // In real implementation, this would be encrypted
            });

            await storage.createSecret(secretData);
          }
        }
      }

      res.json({ 
        success: true,
        flowId: createdFlow.id,
        flow: createdFlow,
        message: "Template instantiated successfully"
      });
    } catch (error) {
      console.error("Error instantiating template:", error);
      res.status(500).json({ message: "Failed to instantiate template" });
    }
  });

  // Agent-specific route to get single agent
  app.get('/api/agents/:id', isAuthenticated, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  // Knowledge Base routes
  app.get('/api/agents/:agentId/knowledge-bases', isAuthenticated, async (req, res) => {
    try {
      const knowledgeBases = await storage.getKnowledgeBases(req.params.agentId);
      res.json(knowledgeBases);
    } catch (error) {
      console.error("Error fetching knowledge bases:", error);
      res.status(500).json({ message: "Failed to fetch knowledge bases" });
    }
  });

  app.post('/api/agents/:agentId/knowledge-bases', isAuthenticated, async (req, res) => {
    try {
      const knowledgeBaseData = insertKnowledgeBaseSchema.parse({ ...req.body, agentId: req.params.agentId });
      const knowledgeBase = await storage.createKnowledgeBase(knowledgeBaseData);
      res.json(knowledgeBase);
    } catch (error) {
      console.error("Error creating knowledge base:", error);
      res.status(500).json({ message: "Failed to create knowledge base" });
    }
  });

  app.put('/api/knowledge-bases/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertKnowledgeBaseSchema.partial().parse(req.body);
      const knowledgeBase = await storage.updateKnowledgeBase(req.params.id, updates);
      res.json(knowledgeBase);
    } catch (error) {
      console.error("Error updating knowledge base:", error);
      res.status(500).json({ message: "Failed to update knowledge base" });
    }
  });

  app.delete('/api/knowledge-bases/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteKnowledgeBase(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting knowledge base:", error);
      res.status(500).json({ message: "Failed to delete knowledge base" });
    }
  });

  // Knowledge Item routes
  app.get('/api/knowledge-bases/:knowledgeBaseId/items', isAuthenticated, async (req, res) => {
    try {
      const knowledgeItems = await storage.getKnowledgeItems(req.params.knowledgeBaseId);
      res.json(knowledgeItems);
    } catch (error) {
      console.error("Error fetching knowledge items:", error);
      res.status(500).json({ message: "Failed to fetch knowledge items" });
    }
  });

  app.post('/api/knowledge-bases/:knowledgeBaseId/items', isAuthenticated, async (req, res) => {
    try {
      const knowledgeItemData = insertKnowledgeItemSchema.parse({ ...req.body, knowledgeBaseId: req.params.knowledgeBaseId });
      const knowledgeItem = await storage.createKnowledgeItem(knowledgeItemData);
      res.json(knowledgeItem);
    } catch (error) {
      console.error("Error creating knowledge item:", error);
      res.status(500).json({ message: "Failed to create knowledge item" });
    }
  });

  app.put('/api/knowledge-items/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertKnowledgeItemSchema.partial().parse(req.body);
      const knowledgeItem = await storage.updateKnowledgeItem(req.params.id, updates);
      res.json(knowledgeItem);
    } catch (error) {
      console.error("Error updating knowledge item:", error);
      res.status(500).json({ message: "Failed to update knowledge item" });
    }
  });

  app.delete('/api/knowledge-items/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteKnowledgeItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting knowledge item:", error);
      res.status(500).json({ message: "Failed to delete knowledge item" });
    }
  });

  // Data Source routes
  app.get('/api/projects/:projectId/data-sources', isAuthenticated, async (req, res) => {
    try {
      const dataSources = await storage.getDataSources(req.params.projectId);
      res.json(dataSources);
    } catch (error) {
      console.error("Error fetching data sources:", error);
      res.status(500).json({ message: "Failed to fetch data sources" });
    }
  });

  app.post('/api/projects/:projectId/data-sources', isAuthenticated, async (req, res) => {
    try {
      const dataSourceData = insertDataSourceSchema.parse({ ...req.body, projectId: req.params.projectId });
      const dataSource = await storage.createDataSource(dataSourceData);
      res.json(dataSource);
    } catch (error) {
      console.error("Error creating data source:", error);
      res.status(500).json({ message: "Failed to create data source" });
    }
  });

  app.put('/api/data-sources/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertDataSourceSchema.partial().parse(req.body);
      const dataSource = await storage.updateDataSource(req.params.id, updates);
      res.json(dataSource);
    } catch (error) {
      console.error("Error updating data source:", error);
      res.status(500).json({ message: "Failed to update data source" });
    }
  });

  app.delete('/api/data-sources/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteDataSource(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting data source:", error);
      res.status(500).json({ message: "Failed to delete data source" });
    }
  });

  // Data Connection routes
  app.get('/api/agents/:agentId/data-connections', isAuthenticated, async (req, res) => {
    try {
      const dataConnections = await storage.getDataConnections(req.params.agentId);
      res.json(dataConnections);
    } catch (error) {
      console.error("Error fetching data connections:", error);
      res.status(500).json({ message: "Failed to fetch data connections" });
    }
  });

  app.post('/api/agents/:agentId/data-connections', isAuthenticated, async (req, res) => {
    try {
      const dataConnectionData = insertDataConnectionSchema.parse({ ...req.body, agentId: req.params.agentId });
      const dataConnection = await storage.createDataConnection(dataConnectionData);
      res.json(dataConnection);
    } catch (error) {
      console.error("Error creating data connection:", error);
      res.status(500).json({ message: "Failed to create data connection" });
    }
  });

  app.put('/api/data-connections/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertDataConnectionSchema.partial().parse(req.body);
      const dataConnection = await storage.updateDataConnection(req.params.id, updates);
      res.json(dataConnection);
    } catch (error) {
      console.error("Error updating data connection:", error);
      res.status(500).json({ message: "Failed to update data connection" });
    }
  });

  app.delete('/api/data-connections/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteDataConnection(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting data connection:", error);
      res.status(500).json({ message: "Failed to delete data connection" });
    }
  });

  // Integration routes
  app.get('/api/projects/:projectId/integrations', isAuthenticated, async (req, res) => {
    try {
      const integrations = await storage.getIntegrations(req.params.projectId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post('/api/projects/:projectId/integrations', isAuthenticated, async (req, res) => {
    try {
      const integrationData = insertAgentIntegrationSchema.parse({ ...req.body, agentId: req.params.agentId });
      const integration = await storage.createIntegration(integrationData);
      res.json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(500).json({ message: "Failed to create integration" });
    }
  });

  app.put('/api/integrations/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertAgentIntegrationSchema.partial().parse(req.body);
      const integration = await storage.updateIntegration(req.params.id, updates);
      res.json(integration);
    } catch (error) {
      console.error("Error updating integration:", error);
      res.status(500).json({ message: "Failed to update integration" });
    }
  });

  app.delete('/api/integrations/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteIntegration(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ message: "Failed to delete integration" });
    }
  });

  // Trigger routes
  app.get('/api/agents/:agentId/triggers', isAuthenticated, async (req, res) => {
    try {
      const triggers = await storage.getTriggers(req.params.agentId);
      res.json(triggers);
    } catch (error) {
      console.error("Error fetching triggers:", error);
      res.status(500).json({ message: "Failed to fetch triggers" });
    }
  });

  app.post('/api/agents/:agentId/triggers', isAuthenticated, async (req, res) => {
    try {
      const triggerData = insertAutonomousTriggerSchema.parse({ ...req.body, agentId: req.params.agentId });
      const trigger = await storage.createTrigger(triggerData);
      res.json(trigger);
    } catch (error) {
      console.error("Error creating trigger:", error);
      res.status(500).json({ message: "Failed to create trigger" });
    }
  });

  app.put('/api/triggers/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertAutonomousTriggerSchema.partial().parse(req.body);
      const trigger = await storage.updateTrigger(req.params.id, updates);
      res.json(trigger);
    } catch (error) {
      console.error("Error updating trigger:", error);
      res.status(500).json({ message: "Failed to update trigger" });
    }
  });

  app.delete('/api/triggers/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTrigger(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting trigger:", error);
      res.status(500).json({ message: "Failed to delete trigger" });
    }
  });

  // Trigger Execution routes
  app.get('/api/triggers/:triggerId/executions', isAuthenticated, async (req, res) => {
    try {
      const executions = await storage.getTriggerEvents(req.params.triggerId);
      res.json(executions);
    } catch (error) {
      console.error("Error fetching trigger executions:", error);
      res.status(500).json({ message: "Failed to fetch trigger executions" });
    }
  });

  app.post('/api/triggers/:triggerId/executions', isAuthenticated, async (req, res) => {
    try {
      const executionData = insertTriggerEventSchema.parse({ ...req.body, triggerId: req.params.triggerId });
      const execution = await storage.createTriggerEvent(executionData);
      res.json(execution);
    } catch (error) {
      console.error("Error creating trigger execution:", error);
      res.status(500).json({ message: "Failed to create trigger execution" });
    }
  });

  // Frontend Component routes
  app.get('/api/agents/:agentId/frontend-components', isAuthenticated, async (req, res) => {
    try {
      const components = await storage.getUiComponents(req.params.agentId);
      res.json(components);
    } catch (error) {
      console.error("Error fetching frontend components:", error);
      res.status(500).json({ message: "Failed to fetch frontend components" });
    }
  });

  app.post('/api/agents/:agentId/frontend-components', isAuthenticated, async (req, res) => {
    try {
      const componentData = insertUiComponentSchema.parse({ ...req.body, agentUiId: req.params.agentUiId });
      const component = await storage.createUiComponent(componentData);
      res.json(component);
    } catch (error) {
      console.error("Error creating frontend component:", error);
      res.status(500).json({ message: "Failed to create frontend component" });
    }
  });

  app.put('/api/frontend-components/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertUiComponentSchema.partial().parse(req.body);
      const component = await storage.updateUiComponent(req.params.id, updates);
      res.json(component);
    } catch (error) {
      console.error("Error updating frontend component:", error);
      res.status(500).json({ message: "Failed to update frontend component" });
    }
  });

  app.delete('/api/frontend-components/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteUiComponent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting frontend component:", error);
      res.status(500).json({ message: "Failed to delete frontend component" });
    }
  });

  // Frontend Layout routes
  app.get('/api/agents/:agentId/frontend-layouts', isAuthenticated, async (req, res) => {
    try {
      const layouts = await storage.getAgentUis(req.params.agentId);
      res.json(layouts);
    } catch (error) {
      console.error("Error fetching frontend layouts:", error);
      res.status(500).json({ message: "Failed to fetch frontend layouts" });
    }
  });

  app.post('/api/agents/:agentId/frontend-layouts', isAuthenticated, async (req, res) => {
    try {
      const layoutData = insertAgentUiSchema.parse({ ...req.body, agentId: req.params.agentId });
      const layout = await storage.createAgentUi(layoutData);
      res.json(layout);
    } catch (error) {
      console.error("Error creating frontend layout:", error);
      res.status(500).json({ message: "Failed to create frontend layout" });
    }
  });

  app.put('/api/frontend-layouts/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertAgentUiSchema.partial().parse(req.body);
      const layout = await storage.updateAgentUi(req.params.id, updates);
      res.json(layout);
    } catch (error) {
      console.error("Error updating frontend layout:", error);
      res.status(500).json({ message: "Failed to update frontend layout" });
    }
  });

  app.delete('/api/frontend-layouts/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteAgentUi(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting frontend layout:", error);
      res.status(500).json({ message: "Failed to delete frontend layout" });
    }
  });

  // Text-to-Agent route
  app.post('/api/text-to-agent', isAuthenticated, async (req, res) => {
    try {
      const { description, inputs, projectId } = req.body;
      
      // This would use OpenAI to generate the flow structure
      // For now, return a basic structure
      const generatedFlow = {
        name: "Generated Flow",
        description: description,
        agents: [],
        tools: [],
        steps: []
      };
      
      res.json(generatedFlow);
    } catch (error) {
      console.error("Error generating agent flow:", error);
      res.status(500).json({ message: "Failed to generate agent flow" });
    }
  });

  // Setup WebSocket server for real-time logs
  const httpServer = server || createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscribe_run' && message.runId) {
          // Store runId on the WebSocket connection
          (ws as any).runId = message.runId;
          
          // Verify the run exists
          const run = await storage.getRun(message.runId);
          if (!run) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Run not found'
            }));
            return;
          }
          
          // Send current run status
          ws.send(JSON.stringify({
            type: 'run_status',
            data: {
              status: run.status,
              sessionId: run.sessionId,
              createdAt: run.createdAt,
              completedAt: run.completedAt
            }
          }));
          
          // Send existing logs for this run
          const logs = await storage.getLogs(message.runId);
          logs.forEach(log => {
            ws.send(JSON.stringify({
              type: 'log',
              data: {
                id: log.id,
                timestamp: log.ts,
                level: log.level,
                tags: log.tags,
                message: log.message,
                payload: log.payload
              }
            }));
          });
          
          ws.send(JSON.stringify({
            type: 'subscribed',
            runId: message.runId
          }));
          
          console.log(`Client subscribed to run ${message.runId}`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Store WebSocket server for execution engine to broadcast logs
  (httpServer as any).wss = wss;
  executionEngine.setWebSocketServer(wss);

  return httpServer;
}
