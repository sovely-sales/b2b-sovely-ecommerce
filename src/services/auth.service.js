import { User } from '../models/User.js';
import { Counter } from '../models/Counter.js';
import { ApiError } from '../utils/ApiError.js';

export class AuthService {
    static async registerUser(userData) {
        const { name, email, password } = userData;

        const existedUser = await User.findOne({ email });
        if (existedUser) {
            throw new ApiError(409, 'User with this email already exists');
        }

        const sequenceDoc = await Counter.getNextSequenceValue('customerId');
        const seq = sequenceDoc.toString().padStart(5, '0');

        const user = await User.create({
            name,
            email,
            passwordHash: password,
            role: 'CUSTOMER',
            customerId: `CUST${seq}`,
        });

        const createdUser = await User.findById(user._id).select('-passwordHash');
        if (!createdUser) {
            throw new ApiError(500, 'Failed to register user');
        }

        return createdUser;
    }

    static async loginUser(credentials) {
        const { email, password } = credentials;

        const user = await User.findOne({ email });

        if (!user) throw new ApiError(401, 'Invalid email or password');

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) throw new ApiError(401, 'Invalid email or password');

        const accessToken = user.generateAccessToken();
        const loggedInUser = await User.findById(user._id).select('-passwordHash');

        return { user: loggedInUser, accessToken };
    }
}
