import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Shield, Users, Server, Database, Activity, Settings, Key } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You do not have administrative privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Admin Control Center
          </h1>
          <p className="text-sm text-muted-foreground">Manage system configuration and high-level operations.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          System Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
              <Users className="w-4 h-4" /> User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground mt-1 text-primary/70">Total Active Administrators</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-green-500" /> Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 animate-pulse">Healthy</div>
            <p className="text-xs text-muted-foreground mt-1 italic">Standalone Mode (fallback active)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-500" /> API Gateway
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">v1.2.0-ent</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">Enterprise Build #459</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              Security Audit
            </CardTitle>
            <CardDescription>Recent system security events.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm p-2 bg-muted/30 rounded border-l-4 border-amber-500">
                <Activity className="w-4 h-4" />
                <span>Admin Login: <b>{user.email}</b></span>
                <span className="ml-auto text-xs opacity-50">Just now</span>
              </div>
               <div className="flex items-center gap-3 text-sm p-2 bg-muted/30 rounded border-l-4 border-green-500">
                <Shield className="w-4 h-4" />
                <span>RBAC Policy: <b>Enforced</b></span>
                <span className="ml-auto text-xs opacity-50">Continuous</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Background Jobs</CardTitle>
            <CardDescription>BullMQ Worker Status (Redis)</CardDescription>
          </CardHeader>
          <CardContent className="h-32 flex items-center justify-center border-2 border-dashed rounded-md">
            <div className="text-center text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">No active jobs in queue</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
