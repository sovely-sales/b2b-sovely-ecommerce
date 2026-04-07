import { User } from '../models/User.js';
import { Counter } from '../models/Counter.js';
import { ApiError } from '../utils/ApiError.js';

export class AuthService {
    static async loginUser(credentials) {
        const { email, phoneNumber, password } = credentials;

        const query = email ? { email } : { phoneNumber };
        const user = await User.findOne(query);

        if (!user) throw new ApiError(401, 'Invalid credentials');

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) throw new ApiError(401, 'Invalid credentials');

        const accessToken = user.generateAccessToken();
        const loggedInUser = await User.findById(user._id).select('-passwordHash');

        return { user: loggedInUser, accessToken };
    }
}
