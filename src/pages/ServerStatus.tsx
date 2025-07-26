import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RotateCcw, Server, Users, HardDrive, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ServerStatus() {
  const { data: serverStatus, isLoading } = useQuery({
    queryKey: ['server-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('server_status')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['server-stats'],
    queryFn: async () => {
      const [usersResult, filesResult, logsResult] = await Promise.all([
        supabase.from('ftp_users').select('id, is_active, used_space_mb'),
        supabase.from('user_files').select('file_size_mb'),
        supabase.from('access_logs').select('id').gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const totalUsers = usersResult.data?.length || 0;
      const activeUsers = usersResult.data?.filter(u => u.is_active)?.length || 0;
      const totalStorage = usersResult.data?.reduce((sum, user) => sum + (user.used_space_mb || 0), 0) || 0;
      const totalFiles = filesResult.data?.length || 0;
      const dailyActivity = logsResult.data?.length || 0;

      return {
        totalUsers,
        activeUsers,
        totalStorage,
        totalFiles,
        dailyActivity
      };
    }
  });

  const formatStorage = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Server Status</h2>
            <p className="text-muted-foreground">
              Monitor and control your FTP server
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              FTP Server Control
            </CardTitle>
            <CardDescription>
              Current server status and control options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">Status:</span>
                  {serverStatus?.is_running ? (
                    <Badge variant="default">Running</Badge>
                  ) : (
                    <Badge variant="destructive">Stopped</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Port: {serverStatus?.port || 21}</p>
                  <p>Max Connections: {serverStatus?.max_connections || 100}</p>
                  <p>Current Connections: {serverStatus?.current_connections || 0}</p>
                  {serverStatus?.start_time && (
                    <p>Started: {new Date(serverStatus.start_time).toLocaleString()}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {serverStatus?.is_running ? (
                  <>
                    <Button variant="outline">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restart
                    </Button>
                    <Button variant="destructive">
                      <Square className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  </>
                ) : (
                  <Button>
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeUsers || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatStorage(stats?.totalStorage || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalFiles || 0} files
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.dailyActivity || 0}</div>
              <p className="text-xs text-muted-foreground">
                actions today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connections</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {serverStatus?.current_connections || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                / {serverStatus?.max_connections || 100} max
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {serverStatus?.is_running ? "Online" : "Offline"}
              </div>
              <p className="text-xs text-muted-foreground">
                server status
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Server Configuration</CardTitle>
            <CardDescription>Current FTP server settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Server Name</p>
                <p className="text-muted-foreground">{serverStatus?.server_name || "FTP Server"}</p>
              </div>
              <div>
                <p className="font-medium">Port</p>
                <p className="text-muted-foreground">{serverStatus?.port || 21}</p>
              </div>
              <div>
                <p className="font-medium">Max Connections</p>
                <p className="text-muted-foreground">{serverStatus?.max_connections || 100}</p>
              </div>
              <div>
                <p className="font-medium">Last Restart</p>
                <p className="text-muted-foreground">
                  {serverStatus?.last_restart ? 
                    new Date(serverStatus.last_restart).toLocaleString() : 
                    "Never"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}