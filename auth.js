import { db } from "../connect.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = (req, res) => {
  //Check IF User Exists

  const q = "SELECT * FROM users WHERE username = ?"; //? = req.body.username

  db.query(q, [req.body.username], (err, data) => {
    if (err) return res.status(500).json({ error: err });
    if (data.length > 0) return res.status(409).json("User Already Exists");

    //Create New User
    //Hash the Password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);

    const q = "INSERT INTO users (username, email, password, name) VALUES (?)";
    const values = [
      req.body.username,
      req.body.email,
      hashedPassword,
      req.body.name,
    ];
    db.query(q, [values], (err, data) => {
      if (err) return res.status(500).json({ error: err });
      return res.status(201).json({ message: "User Has Been Created" });
    });
  });
};

export const login = (req, res) => {
  const q = "SELECT *FROM users WHERE username = ?";

  db.query(q, [req.body.username], (err, data) => {
    if (err) return res.status(500).json({ error: err });
    if (data.length === 0) return res.status(404).json("User Does Not Exist");

    //Check Password
    const checkPassword = bcrypt.compareSync(
      req.body.password,
      data[0].password
    );

    if (!checkPassword)
      return res.status(400).json("Incorrect Password or Username");

    const token = jwt.sign({ id: data[0].id }, "secretkey"); //Change secretkey to something more secure

    const { password, ...others } = data[0]; //Remove Password from the response

    res
      .cookie("accessToken", token, {
        httpOnly: true,
      })
      .status(200)
      .json(others);
  });
};

export const logout = (req, res) => {
  res
    .clearCookie("accessToken", {
      secure: true,
      sameSite: "none",
    })
    .status(200)
    .json("User Successfully Logged Out");
};
