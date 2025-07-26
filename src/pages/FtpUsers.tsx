import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function FtpUsers() {
  const { data: ftpUsers, isLoading } = useQuery({
    queryKey: ['ftp-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ftp_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) return <Badge variant="destructive">Inactive</Badge>;
    
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatQuota = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    return `${used}/${total} MB (${percentage.toFixed(1)}%)`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">FTP Users</h2>
            <p className="text-muted-foreground">
              Manage FTP user accounts and permissions
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : ftpUsers?.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No FTP users found</p>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First User
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            ftpUsers?.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{user.username}</CardTitle>
                      <CardDescription>{user.home_directory}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(user.status, user.is_active)}
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          {user.is_active ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Quota Usage</p>
                      <p className="text-muted-foreground">
                        {formatQuota(user.used_space_mb, user.quota_mb)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Max Connections</p>
                      <p className="text-muted-foreground">{user.max_connections}</p>
                    </div>
                    <div>
                      <p className="font-medium">Valid Period</p>
                      <p className="text-muted-foreground">
                        {new Date(user.start_date).toLocaleDateString()} - {new Date(user.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Created</p>
                      <p className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}