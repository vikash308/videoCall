import { User } from "../models/user.model.js";
import httpStatus from "http-status";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const register = async (req , res)=>{
    const {name, username, password} = req.body;

    try {
        const existingUSer = await User.findOne({username});
        if(existingUSer){
            return res.status(httpStatus.FOUND).json({message: "user already exists"})
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            username,
            password:hashedPassword
        })
        await newUser.save();
        res.status(httpStatus.CREATED).json({message: "User registered"});

    } catch (error) {
        res.json({message:`something went wrong ${error}`})
    }
}


const login = async (req, res)=>{
    const {username, password} = req.body;

    if(!username || !password){
        return res.status(400).json({message:"please provide"})
    }
    try {
        const user =  await User.findOne({username});
        if(!user) return res.status(httpStatus.NOT_FOUND).json({message:"User not found"})

        if(bcrypt.compare(password, user.password)){
            let token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({token})
        }
    } catch (error) {
        return res.status(500).json({message: `something went wrong ${error}`})
    }
}

export {login, register};