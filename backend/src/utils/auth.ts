import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const SECRET_KEY = "SUPER_SECRET_KEY"; // use env in production

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (payload: object) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1d" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET_KEY);
};
