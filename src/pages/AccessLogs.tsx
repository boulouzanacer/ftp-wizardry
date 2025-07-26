import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AccessLogs() {
  const { data: accessLogs, isLoading } = useQuery({
    queryKey: ['access-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_logs')
        .select(`
          *,
          ftp_users!inner(username)
        `)
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    }
  });

  const getActionBadge = (action: string, success: boolean) => {
    const variant = success ? "default" : "destructive";
    
    switch (action) {
      case 'login':
        return <Badge variant={variant}>Login</Badge>;
      case 'logout':
        return <Badge variant="secondary">Logout</Badge>;
      case 'upload':
        return <Badge variant={variant}>Upload</Badge>;
      case 'download':
        return <Badge variant={variant}>Download</Badge>;
      case 'delete':
        return <Badge variant={variant}>Delete</Badge>;
      case 'mkdir':
        return <Badge variant={variant}>Create Dir</Badge>;
      case 'rmdir':
        return <Badge variant={variant}>Remove Dir</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Access Logs</h2>
            <p className="text-muted-foreground">
              Monitor FTP server activity and user actions
            </p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Logs</CardTitle>
            <CardDescription>Search and filter access logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by username, file path, or IP..."
                  className="w-full"
                />
              </div>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="upload">Upload</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest FTP server access logs</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading logs...</div>
            ) : accessLogs?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No access logs found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {accessLogs?.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getActionBadge(log.action, log.success)}
                      <div>
                        <p className="font-medium">{log.ftp_users?.username || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.file_path && `${log.file_path} • `}
                          {log.client_ip ? String(log.client_ip) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                      {log.error_message && (
                        <p className="text-sm text-destructive">{log.error_message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}