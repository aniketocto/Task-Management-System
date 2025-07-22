const companySchema = require("../models/companyModel");

const getCompany = async (req, res) => {
  try {
    const cats = await companySchema.find().sort({ name: 1 }).lean();
    res.json(cats);
  } catch (error) {
    console.error("Error getting compnay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const createCompany = async (req, res) => {
  try {
    const { name } = req.body;
    const cat = await companySchema.findOneAndUpdate(
      { name },
      { name },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(cat);
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await companySchema.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json({ message: "Company deleted successfully" });
  } catch (err) {
    console.error("Error deleting Company:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getCompany, createCompany, deleteCompany };