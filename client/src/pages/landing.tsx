import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/ui/logo";
import { useState, useEffect } from "react";

export default function Landing() {
  const { login } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="container mx-auto px-6 py-4">
          <div className={`flex items-center justify-between transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <div className="flex items-center gap-3 group cursor-pointer">
              <Logo size="md" className="transition-transform duration-300 group-hover:scale-110" />
              <span className="font-bold text-xl bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">
                AgentFlow
              </span>
            </div>
            <Button 
              onClick={() => login()}
              className="bg-gradient-to-r from-primary to-blue-500 text-white hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
              data-testid="button-login"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-32">
        <div className="container mx-auto px-6 text-center">
          <div className={`max-w-5xl mx-auto transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-200">Built with LangGraph & OpenAI</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-black mb-8 leading-tight">
              Build Powerful AI Agent
              <br />
              <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent animate-gradient">
                Workflows Without Code
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              Create, orchestrate, and deploy multi-agent AI workflows with our visual builder. 
              Connect tools like Notion, Slack, and custom APIs in minutes—no coding required.
            </p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <Button 
                size="lg"
                onClick={() => login()}
                className="group bg-gradient-to-r from-primary to-blue-500 text-white px-10 py-6 text-lg hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
                data-testid="button-get-started"
              >
                Get Started Free
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-10 py-6 text-lg bg-white/5 border-white/20 text-white hover:bg-white/10 hover:scale-105 transition-all duration-300"
                data-testid="button-watch-demo"
              >
                <i className="fas fa-play mr-2"></i>
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-24 bg-gradient-to-b from-transparent to-gray-900/50">
        <div className="container mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Everything you need to build AI workflows</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From simple automations to complex multi-agent orchestrations with enterprise-grade reliability
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <i className="fas fa-project-diagram text-white text-xl"></i>
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">Visual Flow Builder</h3>
                <p className="text-gray-300">
                  Drag-and-drop interface to create complex workflows. No coding required.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <i className="fas fa-magic text-white text-xl"></i>
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">Text-to-Agent</h3>
                <p className="text-gray-300">
                  Describe your workflow in plain English and watch it come to life automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                  <i className="fas fa-plug text-white text-xl"></i>
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">3,000+ Integrations</h3>
                <p className="text-gray-300">
                  Connect with Notion, Slack, Google Drive, and thousands of other tools.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                  <i className="fas fa-eye text-white text-xl"></i>
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">Real-time Monitoring</h3>
                <p className="text-gray-300">
                  Watch your agents work with live logs and detailed execution traces.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                  <i className="fas fa-users text-white text-xl"></i>
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">Multi-Agent Teams</h3>
                <p className="text-gray-300">
                  Orchestrate teams of specialized AI agents working together seamlessly.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20">
              <CardContent className="p-0">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <i className="fas fa-layer-group text-white text-xl"></i>
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">Template Library</h3>
                <p className="text-gray-300">
                  Start with 100+ proven templates for common workflows and use cases.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to build your first agent?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of teams already using AgentFlow to automate their workflows.
            </p>
            <Button 
              size="lg"
              onClick={() => login()}
              className="bg-primary text-primary-foreground px-8 py-3 text-lg hover:opacity-90"
              data-testid="button-start-building"
            >
              Start Building Now
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-robot text-primary-foreground text-sm"></i>
              </div>
              <span className="font-bold text-lg">AgentFlow</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 AgentFlow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
