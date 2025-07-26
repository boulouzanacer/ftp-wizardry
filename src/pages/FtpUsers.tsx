import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function FtpUsers() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    home_directory: '',
    quota_mb: 1000,
    max_connections: 5
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const { data, error } = await supabase
        .from('ftp_users')
        .insert([{
          username: userData.username,
          password_hash: `$2b$10$hashed_${userData.password}`, // In real app, hash this properly
          home_directory: userData.home_directory || `/home/ftp/${userData.username}`,
          quota_mb: userData.quota_mb,
          max_connections: userData.max_connections,
          status: 'active',
          is_active: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ftp-users'] });
      setIsCreateDialogOpen(false);
      setNewUser({ username: '', password: '', home_directory: '', quota_mb: 1000, max_connections: 5 });
      toast({
        title: "User created successfully",
        description: "The FTP user has been created and is now active.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating user",
        description: error.message || "Failed to create FTP user",
        variant: "destructive",
      });
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create FTP User</DialogTitle>
                <DialogDescription>
                  Add a new FTP user account with custom settings.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter username"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter password"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="home_directory" className="text-right">
                    Home Dir
                  </Label>
                  <Input
                    id="home_directory"
                    value={newUser.home_directory}
                    onChange={(e) => setNewUser(prev => ({ ...prev, home_directory: e.target.value }))}
                    className="col-span-3"
                    placeholder={`/home/ftp/${newUser.username || 'username'}`}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quota" className="text-right">
                    Quota (MB)
                  </Label>
                  <Input
                    id="quota"
                    type="number"
                    value={newUser.quota_mb}
                    onChange={(e) => setNewUser(prev => ({ ...prev, quota_mb: parseInt(e.target.value) || 1000 }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="connections" className="text-right">
                    Max Connections
                  </Label>
                  <Input
                    id="connections"
                    type="number"
                    value={newUser.max_connections}
                    onChange={(e) => setNewUser(prev => ({ ...prev, max_connections: parseInt(e.target.value) || 5 }))}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={() => createUserMutation.mutate(newUser)}
                  disabled={!newUser.username || !newUser.password || createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : ftpUsers?.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No FTP users found</p>
                  <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
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