import { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const useCategories = () => {
  const [options, setOptions] = useState([]);

    const loadCategories = async () => {
    try {
      const { data } = await axiosInstance.get(
        API_PATHS.CATEGORY.GET_CATEGORIES
      );

      return data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  };

  const upsertCategory = async (name) => {
    try {
      const { data } = await axiosInstance.post(
        API_PATHS.CATEGORY.GET_CATEGORIES,
        { name }
      );

      return data;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
    loadCategories().then((cats) => {
      if (!mounted) return;
      const opts = cats.map((c) => ({
        label: c.name,
        value: c.name,
      }));
      setOptions(opts);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const addCategory = async (name) => {
    const cat = await upsertCategory(name);
    const newOpt = { label: cat.name, value: cat.name };
    setOptions((prev) =>
      prev.some((o) => o.value === newOpt.value) ? prev : [...prev, newOpt]
    );
    return newOpt;
  };

  return { options, addCategory };
};

export default useCategories;
