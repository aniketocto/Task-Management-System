import { useEffect, useState } from "react";
import { API_PATHS } from "../utils/apiPaths";
import axiosInstance from "../utils/axiosInstance";

const useCompany = () => {
  const [companyOptions, setCompanyOptions] = useState([]);

  const loadCompanies = async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.COMPANY.GET_COMPANY);

      return data;
    } catch (error) {
      console.error("Error fetching company:", error);
    }
  };

  const upsertCompany = async (name) => {
    try {
      const { data } = await axiosInstance.post(API_PATHS.COMPANY.GET_COMPANY, {
        name,
      });
      return data;
    } catch (error) {
      console.error("Error creating comnpany:", error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
    loadCompanies().then((comp) => {
      if (!mounted) return;
      const opts = comp.map((item) => ({
        label: item.name,
        value: item.name,
      }));
      setCompanyOptions(opts);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const addCompany = async (name) => {
    const comp = await upsertCompany(name);
    const newOpt = { label: comp.name, value: comp.name };
    setCompanyOptions((prev) =>
      prev.some((o) => o.value === newOpt.value) ? prev : [...prev, newOpt]
    );
    return newOpt;
  };

  return { companyOptions, addCompany };
};

export default useCompany;
