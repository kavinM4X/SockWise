import express from "express";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use("/api/auth", authRoutes);

app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(r.route.path)
  }
});
console.log(app._router.stack.map(layer => {
  if (layer.name === 'router') {
    return layer.regexp;
  }
}));
