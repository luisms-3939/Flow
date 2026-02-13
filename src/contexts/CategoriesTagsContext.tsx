import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

interface CategoriesTagsContextType {
  categories: Category[];
  tags: Tag[];
  setCategories: (categories: Category[]) => void;
  setTags: (tags: Tag[]) => void;
}

const CategoriesTagsContext = createContext<CategoriesTagsContextType | undefined>(undefined);

const defaultCategories: Category[] = [
  { id: "1", name: "Work", color: "#3b82f6" },
  { id: "2", name: "Personal", color: "#10b981" },
  { id: "3", name: "Urgent", color: "#ef4444" },
];

const defaultTags: Tag[] = [
  { id: "1", name: "important", color: "#f59e0b" },
  { id: "2", name: "review", color: "#8b5cf6" },
  { id: "3", name: "urgent", color: "#ef4444" },
];

const CATEGORIES_STORAGE_KEY = "synapflow-categories";
const TAGS_STORAGE_KEY = "synapflow-tags";

export const CategoriesTagsProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
    return defaultCategories;
  });

  const [tags, setTags] = useState<Tag[]>(() => {
    try {
      const stored = localStorage.getItem(TAGS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load tags:", e);
    }
    return defaultTags;
  });

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {
      console.error("Failed to save categories:", e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
    } catch (e) {
      console.error("Failed to save tags:", e);
    }
  }, [tags]);

  return (
    <CategoriesTagsContext.Provider value={{ categories, tags, setCategories, setTags }}>
      {children}
    </CategoriesTagsContext.Provider>
  );
};

export const useCategoriesTags = () => {
  const context = useContext(CategoriesTagsContext);
  if (!context) {
    throw new Error("useCategoriesTags must be used within CategoriesTagsProvider");
  }
  return context;
};
