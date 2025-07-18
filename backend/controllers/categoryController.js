const categoryModel = require("../models/categoryModel");

const getCategories = async (req, res) => {
  try {
    const cats = await categoryModel.find().sort({ name: 1 }).lean();
    res.json(cats);
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const cat = await categoryModel.findOneAndUpdate(
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

module.exports = { getCategories, createCategory };