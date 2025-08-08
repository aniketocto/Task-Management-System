import CreatableSelect from "react-select/creatable";
import useCompany from "../../hooks/useCompany";
import React from "react";

const CompanySelect = ({ value, onChange }) => {
  const { companyOptions, addCompany } = useCompany();

  const handleAdd = async (inputValue) => {
    const newOpt = await addCompany(inputValue);
    onChange(newOpt.value);
  };

  const selectedOption = value ? { label: value, value } : null;

  return (
    <CreatableSelect
      isClearable
      options={companyOptions}
      value={selectedOption}
      onChange={(opt) => onChange(opt ? opt.value : "")}
      onCreateOption={handleAdd}
      placeholder="Select Company or Type"
      styles={{
        control: (base) => ({
          ...base,
          paddingTop: "3.5px",
          paddingBottom: "3.5px",
          backgroundColor: "#ffffffe3",
        }),
      }}
    />
  );
};

export default CompanySelect;
