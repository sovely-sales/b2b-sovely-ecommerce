const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Product = require('./src/models/Product.js').Product;
    const Category = require('./src/models/Category.js').Category;
    const kw = ['home', 'kitchen'];
    const regexes = kw.map(k => new RegExp(k, 'i'));
    const cats = await Category.find({ name: { $in: regexes } }).select('_id').lean();
    console.log('Cats matched:', cats.length);
    const ids = cats.map(c => c._id);
    const count = await Product.countDocuments({ categoryId: { $in: ids } });
    console.log('Products matched:', count);
    process.exit(0);
}).catch(e => {
    console.error('DB Error', e);
    process.exit(1);
});
