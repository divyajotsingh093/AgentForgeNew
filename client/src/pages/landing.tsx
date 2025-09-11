import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-robot text-primary-foreground text-sm"></i>
              </div>
              <span className="font-bold text-xl">AgentFlow</span>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary text-primary-foreground hover:opacity-90"
              data-testid="button-login"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">
              Build Powerful AI Agent Workflows
              <span className="block text-primary mt-2">Without Code</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Create, orchestrate, and deploy multi-agent AI workflows with our visual builder. 
              Connect tools like Notion, Slack, and custom APIs in minutes.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button 
                size="lg"
                onClick={() => window.location.href = '/api/login'}
                className="bg-primary text-primary-foreground px-8 py-3 text-lg hover:opacity-90"
                data-testid="button-get-started"
              >
                Get Started Free
                <i className="fas fa-arrow-right ml-2"></i>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-3 text-lg"
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
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything you need to build AI workflows</h2>
            <p className="text-muted-foreground text-lg">From simple automations to complex multi-agent orchestrations</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-project-diagram text-primary text-xl"></i>
                </div>
                <h3 className="font-semibold text-lg mb-3">Visual Flow Builder</h3>
                <p className="text-muted-foreground">
                  Drag-and-drop interface to create complex workflows. No coding required.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-magic text-secondary text-xl"></i>
                </div>
                <h3 className="font-semibold text-lg mb-3">Text-to-Agent</h3>
                <p className="text-muted-foreground">
                  Describe your workflow in plain English and watch it come to life automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-plug text-accent text-xl"></i>
                </div>
                <h3 className="font-semibold text-lg mb-3">200+ Integrations</h3>
                <p className="text-muted-foreground">
                  Connect with Notion, Slack, Google Drive, and hundreds of other tools.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-eye text-primary text-xl"></i>
                </div>
                <h3 className="font-semibold text-lg mb-3">Real-time Monitoring</h3>
                <p className="text-muted-foreground">
                  Watch your agents work with live logs and detailed execution traces.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-users text-secondary text-xl"></i>
                </div>
                <h3 className="font-semibold text-lg mb-3">Multi-Agent Teams</h3>
                <p className="text-muted-foreground">
                  Orchestrate teams of specialized AI agents working together seamlessly.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-layer-group text-accent text-xl"></i>
                </div>
                <h3 className="font-semibold text-lg mb-3">Template Library</h3>
                <p className="text-muted-foreground">
                  Start with proven templates for common workflows like meeting processing.
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
              onClick={() => window.location.href = '/api/login'}
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
