import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export const useCloudCategoriesTags = () => {
  const { user } = useAuth();
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [tags, setTagsState] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories and tags from database
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          supabase
            .from("categories")
            .select("id, name, color")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("tags")
            .select("id, name, color")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }),
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (tagsRes.error) throw tagsRes.error;

        setCategoriesState(categoriesRes.data || []);
        setTagsState(tagsRes.data || []);
      } catch (err) {
        console.error("Failed to load categories/tags:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Set categories (sync with database)
  const setCategories = useCallback(
    async (newCategories: Category[]) => {
      if (!user) return;

      setCategoriesState(newCategories);

      try {
        // Get current categories from DB
        const { data: currentCategories } = await supabase
          .from("categories")
          .select("id")
          .eq("user_id", user.id);

        const currentIds = new Set(currentCategories?.map((c) => c.id) || []);
        const newIds = new Set(newCategories.map((c) => c.id));

        // Delete removed categories
        const toDelete = [...currentIds].filter((id) => !newIds.has(id));
        if (toDelete.length > 0) {
          await supabase
            .from("categories")
            .delete()
            .in("id", toDelete);
        }

        // Upsert categories
        for (const category of newCategories) {
          if (currentIds.has(category.id)) {
            await supabase
              .from("categories")
              .update({ name: category.name, color: category.color })
              .eq("id", category.id);
          } else {
            await supabase.from("categories").insert({
              id: category.id,
              user_id: user.id,
              name: category.name,
              color: category.color,
            });
          }
        }
      } catch (err) {
        console.error("Failed to sync categories:", err);
      }
    },
    [user]
  );

  // Set tags (sync with database)
  const setTags = useCallback(
    async (newTags: Tag[]) => {
      if (!user) return;

      setTagsState(newTags);

      try {
        // Get current tags from DB
        const { data: currentTags } = await supabase
          .from("tags")
          .select("id")
          .eq("user_id", user.id);

        const currentIds = new Set(currentTags?.map((t) => t.id) || []);
        const newIds = new Set(newTags.map((t) => t.id));

        // Delete removed tags
        const toDelete = [...currentIds].filter((id) => !newIds.has(id));
        if (toDelete.length > 0) {
          await supabase
            .from("tags")
            .delete()
            .in("id", toDelete);
        }

        // Upsert tags
        for (const tag of newTags) {
          if (currentIds.has(tag.id)) {
            await supabase
              .from("tags")
              .update({ name: tag.name, color: tag.color })
              .eq("id", tag.id);
          } else {
            await supabase.from("tags").insert({
              id: tag.id,
              user_id: user.id,
              name: tag.name,
              color: tag.color,
            });
          }
        }
      } catch (err) {
        console.error("Failed to sync tags:", err);
      }
    },
    [user]
  );

  return {
    categories,
    tags,
    setCategories,
    setTags,
    isLoading,
  };
};
