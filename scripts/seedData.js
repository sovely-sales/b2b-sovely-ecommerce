import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "./src/models/Product.js";
import { Category } from "./src/models/Category.js";
import { connectDB } from "./src/db/index.js";

dotenv.config();

const sampleCategories = [
    { name: "Electronics" },
    { name: "Office Supplies" },
    { name: "Industrial Equipment" }
];

const seedDatabase = async () => {
    try {
        await connectDB();

        console.log("Clearing existing catalog data...");
        await Category.deleteMany({});
        await Product.deleteMany({});

        console.log("Seeding Categories...");
        const createdCategories = await Category.insertMany(sampleCategories);

        const elecId = createdCategories.find(c => c.name === "Electronics")._id;
        const officeId = createdCategories.find(c => c.name === "Office Supplies")._id;
        const indId = createdCategories.find(c => c.name === "Industrial Equipment")._id;

        const sampleProducts = [
            {
                sku: "EL-LAP-001",
                title: "ThinkPad X1 Carbon Gen 11",
                categoryId: elecId,
                platformSellPrice: 145000,
                moq: 1,
                inventory: { stock: 50, alertThreshold: 10 }
            },
            {
                sku: "OF-CHR-092",
                title: "Ergonomic Office Chair - Herman Miller",
                categoryId: officeId,
                platformSellPrice: 85000,
                moq: 5,
                inventory: { stock: 120, alertThreshold: 20 }
            },
            {
                sku: "IN-GEN-550",
                title: "550kVA Diesel Generator Sets",
                categoryId: indId,
                platformSellPrice: 1200000,
                moq: 1,
                inventory: { stock: 3, alertThreshold: 1 }
            }
        ];

        console.log("Seeding Products...");
        await Product.insertMany(sampleProducts);

        console.log("✅ Data seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Data seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();
