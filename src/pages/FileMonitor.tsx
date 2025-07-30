import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Folder, Download, Trash2, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function FileMonitor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userFiles, isLoading } = useQuery({
    queryKey: ['user-files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_files')
        .select(`
          *,
          ftp_users!inner(username, home_directory)
        `)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const syncFilesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-ftp-files', {
        method: 'GET'
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-files'] });
      const totalNew = data.results?.reduce((sum: number, result: any) => sum + (result.newFiles || 0), 0) || 0;
      toast({
        title: "Files synced successfully",
        description: `Found ${totalNew} new files`,
      });
    },
    onError: (error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(1)} KB`;
    }
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('image')) return '🖼️';
    if (fileType?.includes('video')) return '🎥';
    if (fileType?.includes('audio')) return '🎵';
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('text')) return '📝';
    if (fileType?.includes('zip') || fileType?.includes('archive')) return '📦';
    return '📄';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">File Monitor</h2>
            <p className="text-muted-foreground">
              Monitor and manage files uploaded by FTP users
            </p>
          </div>
          <Button 
            onClick={() => syncFilesMutation.mutate()}
            disabled={syncFilesMutation.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncFilesMutation.isPending ? 'animate-spin' : ''}`} />
            {syncFilesMutation.isPending ? 'Syncing...' : 'Sync Files'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>File Search</CardTitle>
            <CardDescription>Search for files by name, type, or owner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search files..."
                  className="w-full"
                />
              </div>
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">Loading files...</div>
          ) : userFiles?.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground mt-4">No files found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            userFiles?.map((file) => (
              <Card key={file.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {getFileIcon(file.file_type || '')}
                      </div>
                      <div>
                        <p className="font-medium">{file.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.file_path} • {file.ftp_users?.username}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatFileSize(Number(file.file_size_mb))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {file.last_accessed && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Last accessed: {new Date(file.last_accessed).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}