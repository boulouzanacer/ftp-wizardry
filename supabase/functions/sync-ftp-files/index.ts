import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FileUpload {
  username: string
  filename: string
  filepath: string
  filesize: number
  timestamp?: string
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

    if (req.method === 'POST') {
      try {
        // Handle file upload notification
        const uploadData: FileUpload = await req.json()
        
        console.log('Received file upload notification:', uploadData)

        // Find the FTP user
        const { data: ftpUser, error: userError } = await supabaseClient
          .from('ftp_users')
          .select('id')
          .eq('username', uploadData.username)
          .single()

        if (userError || !ftpUser) {
          console.error('FTP user not found:', uploadData.username)
          return new Response(JSON.stringify({ 
            error: 'User not found' 
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Check if file already exists
        const { data: existingFile } = await supabaseClient
          .from('user_files')
          .select('id')
          .eq('ftp_user_id', ftpUser.id)
          .eq('file_path', uploadData.filepath)
          .single()

        if (existingFile) {
          console.log('File already exists in database')
          return new Response(JSON.stringify({ 
            message: 'File already tracked' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Insert new file record
        const { error: insertError } = await supabaseClient
          .from('user_files')
          .insert({
            ftp_user_id: ftpUser.id,
            file_name: uploadData.filename,
            file_path: uploadData.filepath,
            file_size_mb: uploadData.filesize / (1024 * 1024),
            file_type: getFileType(uploadData.filename),
            uploaded_at: uploadData.timestamp || new Date().toISOString()
          })

        if (insertError) {
          console.error('Error inserting file record:', insertError)
          return new Response(JSON.stringify({ 
            error: insertError.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        console.log('File record inserted successfully')
        return new Response(JSON.stringify({ 
          success: true,
          message: 'File tracked successfully' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError)
        return new Response(JSON.stringify({ 
          error: 'Invalid JSON data' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Handle manual sync (for testing) - This is triggered by the Sync Files button
    if (req.method === 'GET') {
      console.log('Creating test file records...')
      
      // Get all active FTP users
      const { data: ftpUsers, error: usersError } = await supabaseClient
        .from('ftp_users')
        .select('id, username')
        .eq('is_active', true)

      if (usersError) {
        console.error('Error fetching users:', usersError)
        return new Response(JSON.stringify({ 
          error: usersError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const testFiles = [
        { name: 'test-image.jpg', size: 2048000, type: 'image/jpeg' },
        { name: 'document.pdf', size: 1024000, type: 'application/pdf' },
        { name: 'data.txt', size: 512000, type: 'text/plain' },
        { name: 'video.mp4', size: 5120000, type: 'video/mp4' },
        { name: 'presentation.pptx', size: 3072000, type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
      ]

      let insertedCount = 0

      for (const user of ftpUsers || []) {
        for (const testFile of testFiles) {
          const filePath = `/home/vsftpd/${user.username}/${testFile.name}`
          
          // Check if already exists
          const { data: existing } = await supabaseClient
            .from('user_files')
            .select('id')
            .eq('ftp_user_id', user.id)
            .eq('file_path', filePath)
            .maybeSingle()

          if (!existing) {
            const { error } = await supabaseClient
              .from('user_files')
              .insert({
                ftp_user_id: user.id,
                file_name: testFile.name,
                file_path: filePath,
                file_size_mb: testFile.size / (1024 * 1024),
                file_type: testFile.type,
                uploaded_at: new Date().toISOString()
              })

            if (!error) {
              insertedCount++
              console.log(`Inserted file: ${testFile.name} for user: ${user.username}`)
            } else {
              console.error(`Error inserting file ${testFile.name}:`, error)
            }
          }
        }
      }

      console.log(`Successfully created ${insertedCount} test file records`)
      
      return new Response(JSON.stringify({ 
        success: true,
        message: `Created ${insertedCount} test file records`,
        usersProcessed: ftpUsers?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      error: 'Method not allowed' 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

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
    'mp3': 'audio/mpeg',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }
  
  return typeMap[ext || ''] || 'application/octet-stream'
}