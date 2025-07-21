import useCompany from "../../hooks/useCompany";
import useCategories from "../../hooks/useCategories";
import Creatable from "react-select/creatable";
const CategorySelect = ({ value, onChange, from }) => {
  const { options, addCategory } = useCategories();
  const { companyOptions, addCompany } = useCompany();

  const handleCreate = async (inputValue) => {
    const newOpt = await addCategory(inputValue);
    onChange(newOpt.value);
  };

  const handleAdd = async (inputValue) => {
    const newOpt = await addCompany(inputValue);
    onChange(newOpt.value);
  };

  const selectedOption = value ? { label: value, value } : null;

  return (
    <Creatable
      isClearable
      options={from === "tasks" ? companyOptions : options}
      value={selectedOption}
      onChange={(opt) => onChange(opt ? opt.value : "")}
      onCreateOption={from === "tasks" ? handleAdd : handleCreate}
      placeholder={from === "tasks" ? "Select Company or Type" : "Select Category or Type"}
      styles={{
        control: (base) => ({
          ...base,
          paddingTop: "3.5px",
          paddingBottom: "3.5px",
        }),
      }}
    />
  );
};

export default CategorySelect;
