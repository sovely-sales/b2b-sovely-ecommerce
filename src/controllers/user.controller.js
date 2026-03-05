import { User } from "../models/User.js";

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        const existedUser = await User.findOne({ email });

        if (existedUser) {
            return res.status(409).json({
                success: false,
                message: "User with email already exists"
            });
        }

        const user = await User.create({
            name,
            email,
            passwordHash: password
        });

        const createdUser = await User.findById(user._id).select("-passwordHash");

        return res.status(201).json({
            success: true,
            data: createdUser,
            message: "User registered successfully"
        });

    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Something went wrong while registering"
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User does not exist"
            });
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid user credentials"
            });
        }

        const accessToken = user.generateAccessToken();
        const loggedInUser = await User.findById(user._id).select("-passwordHash");

        const options = {
            httpOnly: true,
            secure: false
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .json({
                success: true,
                data: { user: loggedInUser, accessToken },
                message: "User logged in successfully"
            });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Something went wrong while logging in"
        });
    }
};

export { registerUser, loginUser };
