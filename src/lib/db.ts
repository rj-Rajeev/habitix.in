import mongoose from "mongoose";

const mongo_uri = process.env.MONGODB_URI;

const connectDb = async () => {
  try {
    if (!mongo_uri) {
      throw new Error("MONGODB_URI is not defined");
    }
    await mongoose.connect(mongo_uri as string);
    console.log("DB is Connected");
  } catch (error) {
    console.log(error);
  }
};

export default connectDb;
