import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, Tables } from "@/integrations/supabase/types";

export type FarmDataSnapshot = TablesInsert<"farm_data_snapshots">;
export type FarmDataSnapshotRow = Tables<"farm_data_snapshots">;

export const saveFarmSnapshot = async (snapshot: Omit<FarmDataSnapshot, "id" | "created_at">) => {
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
};

export const getFarmSnapshots = async (userId: string, type?: string) => {
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
};

export const getSnapshotById = async (snapshotId: string) => {
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
};
