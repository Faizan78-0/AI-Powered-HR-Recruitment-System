import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

interface DecodedToken extends JwtPayload {
  userId: string;
}

export const verifyToken = (token: string): DecodedToken => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error: any) {
    throw new Error("Invalid or expired token");
  }
};
