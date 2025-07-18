import useCategories from "../../hooks/useCategories";
import Creatable from "react-select/creatable";
const CategorySelect = ({ value, onChange }) => {
  const { options, addCategory } = useCategories();

  const handleCreate = async (inputValue) => {
    const newOpt = await addCategory(inputValue);
    onChange(newOpt.value);
  };

  const selectedOption = value ? { label: value, value } : null;

  return (
    <Creatable
      isClearable
      options={options}
      value={selectedOption}
      onChange={(opt) => onChange(opt ? opt.value : "")}
      onCreateOption={handleCreate}
      placeholder="Type or Select Category"
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
