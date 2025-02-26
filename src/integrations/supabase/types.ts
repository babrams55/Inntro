export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      access_requests: {
        Row: {
          approval_token: string
          created_at: string
          email: string
          id: string
          instagram: string
          status: string
          university: string
        }
        Insert: {
          approval_token: string
          created_at?: string
          email: string
          id?: string
          instagram: string
          status?: string
          university: string
        }
        Update: {
          approval_token?: string
          created_at?: string
          email?: string
          id?: string
          instagram?: string
          status?: string
          university?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string | null
          read: boolean | null
          sender_pair_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id?: string | null
          read?: boolean | null
          sender_pair_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string | null
          read?: boolean | null
          sender_pair_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "pair_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_pair_id_fkey"
            columns: ["sender_pair_id"]
            isOneToOne: false
            referencedRelation: "friend_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_pairs: {
        Row: {
          bio: string | null
          city: string
          created_at: string
          gender: string
          id: string
          photo1_url: string | null
          photo2_url: string | null
          status: string | null
          user1_email: string
          user2_email: string
        }
        Insert: {
          bio?: string | null
          city: string
          created_at?: string
          gender: string
          id?: string
          photo1_url?: string | null
          photo2_url?: string | null
          status?: string | null
          user1_email: string
          user2_email: string
        }
        Update: {
          bio?: string | null
          city?: string
          created_at?: string
          gender?: string
          id?: string
          photo1_url?: string | null
          photo2_url?: string | null
          status?: string | null
          user1_email?: string
          user2_email?: string
        }
        Relationships: []
      }
      pair_likes: {
        Row: {
          created_at: string
          from_pair_id: string | null
          id: string
          to_pair_id: string | null
        }
        Insert: {
          created_at?: string
          from_pair_id?: string | null
          id?: string
          to_pair_id?: string | null
        }
        Update: {
          created_at?: string
          from_pair_id?: string | null
          id?: string
          to_pair_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pair_likes_from_pair_id_fkey"
            columns: ["from_pair_id"]
            isOneToOne: false
            referencedRelation: "friend_pairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pair_likes_to_pair_id_fkey"
            columns: ["to_pair_id"]
            isOneToOne: false
            referencedRelation: "friend_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      pair_matches: {
        Row: {
          created_at: string
          id: string
          pair1_id: string | null
          pair2_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          pair1_id?: string | null
          pair2_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          pair1_id?: string | null
          pair2_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pair_matches_pair1_id_fkey"
            columns: ["pair1_id"]
            isOneToOne: false
            referencedRelation: "friend_pairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pair_matches_pair2_id_fkey"
            columns: ["pair2_id"]
            isOneToOne: false
            referencedRelation: "friend_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      pair_referrals: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          invitee_pair_id: string | null
          inviter_pair_id: string | null
          referral_code: string
          used: boolean | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          invitee_pair_id?: string | null
          inviter_pair_id?: string | null
          referral_code: string
          used?: boolean | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          invitee_pair_id?: string | null
          inviter_pair_id?: string | null
          referral_code?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pair_referrals_invitee_pair_id_fkey"
            columns: ["invitee_pair_id"]
            isOneToOne: false
            referencedRelation: "friend_pairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pair_referrals_inviter_pair_id_fkey"
            columns: ["inviter_pair_id"]
            isOneToOne: false
            referencedRelation: "friend_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          created_by_email: string | null
          email_sent: boolean | null
          email_to: string | null
          expires_at: string
          id: string
          used: boolean | null
          used_by_email: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by_email?: string | null
          email_sent?: boolean | null
          email_to?: string | null
          expires_at?: string
          id?: string
          used?: boolean | null
          used_by_email?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by_email?: string | null
          email_sent?: boolean | null
          email_to?: string | null
          expires_at?: string
          id?: string
          used?: boolean | null
          used_by_email?: string | null
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          used?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_access_request: {
        Args: {
          request_id: string
          new_status: string
          admin_email: string
        }
        Returns: Json
      }
      is_admin: {
        Args: {
          user_email: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
