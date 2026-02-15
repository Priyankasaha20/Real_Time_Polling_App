declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
      profilePicture: string | null;
    };
  }
}
