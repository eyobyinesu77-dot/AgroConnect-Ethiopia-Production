const Product = require('../models/Product');

const getAllProducts = async () => await Product.find({}).populate('farmer', 'fullName region');
const createNewProduct = async (data) => await Product.create(data);

module.exports = { getAllProducts, createNewProduct };