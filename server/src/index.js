import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { userRouter } from "./routes/user.js";
import { recipesRouter } from "./routes/recipes.js";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/auth", userRouter);
app.use("/recipes", recipesRouter);
const uri = "mongodb+srv://shux:ayantika@cluster0.bkaw5xv.mongodb.net/recipetest?retryWrites=true&w=majority";

mongoose.connect(
  uri,

  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

app.listen(3002, () => console.log("Server started"));
export default app;
