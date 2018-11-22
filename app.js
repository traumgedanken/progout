require("dotenv").config();
require("./config/passport");

const express = require("express");
const mongoose = require("mongoose");
const mustache = require("mustache-express");
const path = require("path");
const auth = require("./config/auth");
const Log = require("./models/log");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const busboyBodyParser = require("busboy-body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");

const app = express();

app.use(express.static("public"));
app.engine("mst", mustache(path.join(__dirname, "views", "partials")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "mst");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(busboyBodyParser({ limit: "5mb" }));
app.use(cookieParser());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use("/courses", require("./routes/courses")("/courses"));
app.use("/tasks", require("./routes/tasks")("/tasks"));
app.use("/users", require("./routes/users")("/users"));
app.use("/auth", require("./routes/auth")("/auth"));
app.use("/logs", require("./routes/logs")("/logs"));
app.use("/api/v1", require("./routes/api")("/api/v1"));
app.use("/developer/v1", require("./routes/developer")("/developer/v1"));

const port = process.env.PORT;

mongoose
    .connect(
        process.env.DB_URL,
        {
            useNewUrlParser: true,
            useCreateIndex: true
        }
    )
    .then(() => {
        console.log("Connected to mLab DB");
    })
    .then(() => {
        app.listen(port, () => console.log(`Server started listen at port: [${port}]`));
    })
    .catch(err => console.log(`Error at start: ${err.toString()}`));

app.get("/", function(req, res) {
    const data = {
        home_button: true,
        user: req.user
    };
    if (req.user) auth.updateData(data, req);
    res.render("index", data);
});

app.get("/about", function(req, res) {
    const data = {
        about_button: true,
        user: req.user
    };
    if (req.user) auth.updateData(data, req);
    res.render("about", data);
});

app.get("/error", (req, res) => {
    const data = { error: { message: req.flash("message")[0] } };
    if (req.user) auth.updateData(data, req);
    res.status(parseInt(req.query.code) || 404).render("error", data);
});

app.get("/profile", auth.checkAuth(""), async (req, res) => {
    try {
        const data = {};
        auth.updateData(data, req);
        data.userToDisplay = req.user;
        res.render("profile", data);
    } catch (err) {
        Log.handleError("", req, res, { code: 500, message: err.toString() });
    }
});

app.get("*", function(req, res) {
    Log.handleError("", req, res, { code: 404 });
});
