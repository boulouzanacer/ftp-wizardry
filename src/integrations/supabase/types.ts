export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          action: Database["public"]["Enums"]["log_action"]
          client_ip: unknown | null
          error_message: string | null
          file_path: string | null
          ftp_user_id: string | null
          id: string
          success: boolean | null
          timestamp: string | null
          user_agent: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["log_action"]
          client_ip?: unknown | null
          error_message?: string | null
          file_path?: string | null
          ftp_user_id?: string | null
          id?: string
          success?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["log_action"]
          client_ip?: unknown | null
          error_message?: string | null
          file_path?: string | null
          ftp_user_id?: string | null
          id?: string
          success?: boolean | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_ftp_user_id_fkey"
            columns: ["ftp_user_id"]
            isOneToOne: false
            referencedRelation: "ftp_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ftp_users: {
        Row: {
          allowed_ips: string[] | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          home_directory: string
          id: string
          is_active: boolean | null
          max_connections: number | null
          password_hash: string
          quota_mb: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          system_username: string | null
          updated_at: string | null
          used_space_mb: number | null
          username: string
        }
        Insert: {
          allowed_ips?: string[] | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          home_directory: string
          id?: string
          is_active?: boolean | null
          max_connections?: number | null
          password_hash: string
          quota_mb?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          system_username?: string | null
          updated_at?: string | null
          used_space_mb?: number | null
          username: string
        }
        Update: {
          allowed_ips?: string[] | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          home_directory?: string
          id?: string
          is_active?: boolean | null
          max_connections?: number | null
          password_hash?: string
          quota_mb?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          system_username?: string | null
          updated_at?: string | null
          used_space_mb?: number | null
          username?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      server_status: {
        Row: {
          current_connections: number | null
          id: string
          is_running: boolean | null
          last_restart: string | null
          max_connections: number | null
          port: number | null
          server_name: string
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          current_connections?: number | null
          id?: string
          is_running?: boolean | null
          last_restart?: string | null
          max_connections?: number | null
          port?: number | null
          server_name?: string
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          current_connections?: number | null
          id?: string
          is_running?: boolean | null
          last_restart?: string | null
          max_connections?: number | null
          port?: number | null
          server_name?: string
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_files: {
        Row: {
          file_name: string
          file_path: string
          file_size_mb: number
          file_type: string | null
          ftp_user_id: string | null
          id: string
          last_accessed: string | null
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size_mb: number
          file_type?: string | null
          ftp_user_id?: string | null
          id?: string
          last_accessed?: string | null
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size_mb?: number
          file_type?: string | null
          ftp_user_id?: string | null
          id?: string
          last_accessed?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_files_ftp_user_id_fkey"
            columns: ["ftp_user_id"]
            isOneToOne: false
            referencedRelation: "ftp_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      hash_password: {
        Args: { plain_password: string }
        Returns: string
      }
      is_ftp_user_active: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      log_action:
        | "login"
        | "logout"
        | "upload"
        | "download"
        | "delete"
        | "mkdir"
        | "rmdir"
      user_status: "active" | "inactive" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      log_action: [
        "login",
        "logout",
        "upload",
        "download",
        "delete",
        "mkdir",
        "rmdir",
      ],
      user_status: ["active", "inactive", "suspended"],
    },
  },
} as const
