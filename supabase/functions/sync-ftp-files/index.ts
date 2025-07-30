import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FtpUser {
  id: string
  username: string
  home_directory: string
}

interface FileInfo {
  name: string
  path: string
  size: number
  mtime: Date
  type: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all FTP users
    const { data: ftpUsers, error: usersError } = await supabaseClient
      .from('ftp_users')
      .select('id, username, home_directory')
      .eq('is_active', true)

    if (usersError) {
      throw usersError
    }

    const syncResults = []

    for (const user of ftpUsers as FtpUser[]) {
      try {
        // Get existing files for this user from database
        const { data: existingFiles } = await supabaseClient
          .from('user_files')
          .select('file_path, file_name')
          .eq('ftp_user_id', user.id)

        const existingFilePaths = new Set(existingFiles?.map(f => f.file_path) || [])

        // Scan user's directory for files
        const userDir = user.home_directory
        const files = await scanDirectory(userDir)

        // Insert new files into database
        const newFiles = files.filter(file => !existingFilePaths.has(file.path))
        
        if (newFiles.length > 0) {
          const fileRecords = newFiles.map(file => ({
            ftp_user_id: user.id,
            file_name: file.name,
            file_path: file.path,
            file_size_mb: file.size / (1024 * 1024), // Convert bytes to MB
            file_type: file.type,
            uploaded_at: file.mtime.toISOString()
          }))

          const { error: insertError } = await supabaseClient
            .from('user_files')
            .insert(fileRecords)

          if (insertError) {
            console.error(`Error inserting files for user ${user.username}:`, insertError)
          }
        }

        syncResults.push({
          user: user.username,
          filesFound: files.length,
          newFiles: newFiles.length
        })

      } catch (error) {
        console.error(`Error scanning directory for user ${user.username}:`, error)
        syncResults.push({
          user: user.username,
          error: error.message
        })
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results: syncResults 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function scanDirectory(dirPath: string): Promise<FileInfo[]> {
  const files: FileInfo[] = []
  
  try {
    for await (const entry of Deno.readDir(dirPath)) {
      if (entry.isFile) {
        const fullPath = `${dirPath}/${entry.name}`
        const stat = await Deno.stat(fullPath)
        
        files.push({
          name: entry.name,
          path: fullPath,
          size: stat.size,
          mtime: stat.mtime || new Date(),
          type: getFileType(entry.name)
        })
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
  }
  
  return files
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const typeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg', 
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'zip': 'application/zip',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg'
  }
  
  return typeMap[ext || ''] || 'application/octet-stream'
}