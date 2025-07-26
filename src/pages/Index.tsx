import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Users, FileText, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { data: serverStatus } = useQuery({
    queryKey: ['dashboard-server-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('server_status')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: quickStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [usersResult, filesResult, logsResult] = await Promise.all([
        supabase.from('ftp_users').select('id, is_active, status'),
        supabase.from('user_files').select('id'),
        supabase.from('access_logs').select('id, action, success').gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const totalUsers = usersResult.data?.length || 0;
      const activeUsers = usersResult.data?.filter(u => u.is_active && u.status === 'active')?.length || 0;
      const totalFiles = filesResult.data?.length || 0;
      const recentActions = logsResult.data?.length || 0;
      const failedActions = logsResult.data?.filter(log => !log.success)?.length || 0;

      return {
        totalUsers,
        activeUsers,
        totalFiles,
        recentActions,
        failedActions
      };
    }
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your FTP server management system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Server Status</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {serverStatus?.is_running ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Badge variant="default">Running</Badge>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <Badge variant="destructive">Stopped</Badge>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Port {serverStatus?.port || 21}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">FTP Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {quickStats?.activeUsers || 0} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats?.totalFiles || 0}</div>
              <p className="text-xs text-muted-foreground">
                files uploaded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats?.recentActions || 0}</div>
              <p className="text-xs text-muted-foreground">
                actions today
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Current status of FTP server components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">FTP Service</span>
                {serverStatus?.is_running ? (
                  <Badge variant="default">Online</Badge>
                ) : (
                  <Badge variant="destructive">Offline</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                <Badge variant="default">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">User Authentication</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">File System</span>
                <Badge variant="default">Available</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common management tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <a href="/ftp-users" className="text-sm text-primary hover:underline">
                  → Manage Users
                </a>
                <a href="/server-status" className="text-sm text-primary hover:underline">
                  → Server Control
                </a>
                <a href="/file-monitor" className="text-sm text-primary hover:underline">
                  → View Files
                </a>
                <a href="/access-logs" className="text-sm text-primary hover:underline">
                  → Check Logs
                </a>
              </div>
              
              {quickStats?.failedActions && quickStats.failedActions > 0 && (
                <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ {quickStats.failedActions} failed actions in the last 24 hours
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
