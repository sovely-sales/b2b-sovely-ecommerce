import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fakerEN_IN as faker } from '@faker-js/faker';
import { User } from '../src/models/User.js';

dotenv.config();

const generateGSTIN = () => {
    const stateCode = faker.number.int({ min: 10, max: 37 }).toString().padStart(2, '0');
    const panChars = faker.string.alpha({ length: 5, casing: 'upper' });
    const panNums = faker.string.numeric(4);
    const panChar2 = faker.string.alpha({ length: 1, casing: 'upper' });
    const entity = faker.number.int({ min: 1, max: 9 }).toString();
    const checksum = faker.string.alphanumeric({ length: 1, casing: 'upper' });
    return `${stateCode}${panChars}${panNums}${panChar2}${entity}Z${checksum}`;
};

const seedUsers = async () => {
    try {
        const dbUri = process.env.MONGODB_URI;
        await mongoose.connect(dbUri);
        console.log('📦 Connected to DB. Clearing old Users...');
        await User.deleteMany({});

        console.log('🌱 Seeding Static Test Accounts...');
        await User.create([
            {
                name: 'System Admin', email: 'admin@sovely.in', phoneNumber: '9876543210',
                passwordHash: 'Admin@123', role: 'ADMIN', accountType: 'B2B', isVerifiedB2B: true
            },
            {
                name: 'Rahul Sharma', email: 'b2b@sovely.in', phoneNumber: '9999999998',
                passwordHash: 'Password@123', role: 'RESELLER', accountType: 'B2B',
                companyName: 'Sharma Traders & Co.', gstin: generateGSTIN(),
                kycStatus: 'APPROVED', isVerifiedB2B: true, walletBalance: 50000,
                billingAddress: { street: '12/A, Peenya Industrial Area', city: 'Bengaluru', state: 'Karnataka', zip: '560058' }
            }
        ]);

        console.log('🌱 Seeding 500 Random B2B Resellers...');
        const b2bUsers = Array.from({ length: 500 }).map(() => {
            const companyName = `${faker.person.lastName()} ${faker.helpers.arrayElement(['Enterprises', 'Traders', 'Industries', 'Exports'])}`;
            return {
                name: faker.person.fullName(),
                email: faker.internet.email(),
                phoneNumber: faker.phone.number('9#########'),
                passwordHash: 'Password@123',
                role: 'RESELLER',
                accountType: 'B2B',
                companyName: companyName,
                gstin: generateGSTIN(),
                kycStatus: faker.helpers.arrayElement(['PENDING', 'APPROVED', 'REJECTED']),
                isVerifiedB2B: true,
                walletBalance: faker.number.int({ min: 0, max: 200000 }),
                bankDetails: {
                    accountName: companyName,
                    accountNumber: faker.finance.accountNumber(12),
                    ifscCode: `${faker.string.alpha({ length: 4, casing: 'upper' })}000${faker.string.numeric(4)}`,
                    bankName: faker.helpers.arrayElement(['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'])
                },
                billingAddress: {
                    street: faker.location.streetAddress(),
                    city: faker.location.city(),
                    state: faker.location.state(),
                    zip: faker.location.zipCode('######')
                }
            };
        });
        
        await User.create(b2bUsers);

        console.log('✅ Users Seeding Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ User Seeding Failed:', error);
        process.exit(1);
    }
};

seedUsers();
