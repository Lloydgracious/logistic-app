export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          id: string;
          message: string;
          operator: string | null;
          timestamp: string;
          type: "INCOMING" | "OUTGOING" | "MANUAL";
        };
        Insert: {
          id: string;
          message: string;
          operator?: string | null;
          timestamp?: string;
          type: "INCOMING" | "OUTGOING" | "MANUAL";
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Insert"]>;
        Relationships: [];
      };
      container_stock: {
        Row: {
          car_number: string;
          container_id: string;
          container_number: string;
          id: string;
          initial_quantity: number;
          inventory_section_id: string | null;
          product_name: string;
          received_at: string;
          remaining_quantity: number;
          supplier_name: string;
          unit: string | null;
          updated_at: string;
        };
        Insert: {
          car_number: string;
          container_id: string;
          container_number: string;
          id: string;
          initial_quantity: number;
          inventory_section_id?: string | null;
          product_name: string;
          received_at?: string;
          remaining_quantity: number;
          supplier_name: string;
          unit?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["container_stock"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          name: string;
          note: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id: string;
          name: string;
          note?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      incoming_items: {
        Row: {
          container_number: string | null;
          id: string;
          incoming_id: string;
          inventory_section_id: string | null;
          name: string;
          quantity: number;
          unit: string | null;
        };
        Insert: {
          container_number?: string | null;
          id?: string;
          incoming_id: string;
          inventory_section_id?: string | null;
          name: string;
          quantity: number;
          unit?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["incoming_items"]["Insert"]>;
        Relationships: [];
      };
      incoming_shipments: {
        Row: {
          arrival_time: string;
          car_number: string;
          container_number: string;
          duration_hours: number;
          id: string;
          note: string | null;
          status: "ON_THE_WAY" | "AT_BRIDGE" | "IN_GARAGE";
          supplier_name: string;
        };
        Insert: {
          arrival_time?: string;
          car_number: string;
          container_number: string;
          duration_hours?: number;
          id: string;
          note?: string | null;
          status: "ON_THE_WAY" | "AT_BRIDGE" | "IN_GARAGE";
          supplier_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["incoming_shipments"]["Insert"]>;
        Relationships: [];
      };
      inventory_sections: {
        Row: {
          created_at: string;
          id: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_sections"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          container_id: string | null;
          container_number: string | null;
          id: string;
          name: string;
          order_id: string;
          quantity: number;
          unit: string | null;
        };
        Insert: {
          container_id?: string | null;
          container_number?: string | null;
          id?: string;
          name: string;
          order_id: string;
          quantity: number;
          unit?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          car_number: string;
          customer_name: string;
          customer_note: string | null;
          final_date: string;
          id: string;
          order_time: string;
          status: "PENDING" | "PREPARING" | "ON_THE_WAY" | "DELIVERED";
        };
        Insert: {
          car_number: string;
          customer_name: string;
          customer_note?: string | null;
          final_date: string;
          id: string;
          order_time?: string;
          status: "PENDING" | "PREPARING" | "ON_THE_WAY" | "DELIVERED";
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
