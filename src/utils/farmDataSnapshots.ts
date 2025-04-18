
import { supabase } from "@/integrations/supabase/client";

// Define the structure of farm data snapshots
export interface FarmDataSnapshot {
  id?: string;
  created_at?: string;
  user_id: string;
  type: string;
  timestamp: string;
  data: any;
}

export const saveFarmSnapshot = async (snapshot: Omit<FarmDataSnapshot, "id" | "created_at">) => {
  try {
    const { data, error } = await supabase
      .from("farm_data_snapshots")
      .insert(snapshot)
      .select()
      .single();

    if (error) {
      console.error("Error saving farm snapshot:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in saveFarmSnapshot:", error);
    throw error;
  }
};

export const getFarmSnapshots = async (userId: string, type?: string) => {
  try {
    let query = supabase
      .from("farm_data_snapshots")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching farm snapshots:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getFarmSnapshots:", error);
    throw error;
  }
};

export const getSnapshotById = async (snapshotId: string) => {
  try {
    const { data, error } = await supabase
      .from("farm_data_snapshots")
      .select("*")
      .eq("id", snapshotId)
      .single();

    if (error) {
      console.error("Error fetching snapshot by ID:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getSnapshotById:", error);
    throw error;
  }
};
