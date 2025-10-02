import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/ui/logo";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Auth() {
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login();
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(); // Using same dummy auth for signup
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <Card className="w-full max-w-md bg-gray-900/50 border-white/10 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-4">
            <Logo size="lg" />
            <span className="font-bold text-2xl bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Vortic
            </span>
          </div>
          <CardTitle className="text-2xl text-white text-center">Welcome</CardTitle>
          <CardDescription className="text-gray-400 text-center">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="demo@example.com"
                    defaultValue="demo@example.com"
                    className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500"
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    defaultValue="password"
                    className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500"
                    data-testid="input-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-secondary text-black hover:shadow-lg hover:shadow-primary/50 transition-all duration-300"
                  disabled={isLoading}
                  data-testid="button-login-submit"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <div className="text-center text-sm text-gray-400">
                <p className="mt-2">Demo credentials are pre-filled</p>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-white">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    defaultValue="Demo User"
                    className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500"
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-white">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="demo@example.com"
                    defaultValue="demo@example.com"
                    className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500"
                    data-testid="input-signup-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-white">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    defaultValue="password"
                    className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500"
                    data-testid="input-signup-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-secondary text-black hover:shadow-lg hover:shadow-primary/50 transition-all duration-300"
                  disabled={isLoading}
                  data-testid="button-signup-submit"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
              <div className="text-center text-sm text-gray-400">
                <p className="mt-2">Demo credentials are pre-filled</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => setLocation("/")}
              className="text-gray-400 hover:text-white"
              data-testid="link-back-home"
            >
              ← Back to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
