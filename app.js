if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}
console.log(process.env.SECRET);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./util/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingsrouter = require("./routes/listing.js");
const reviewsrouter = require("./routes/review.js");
const userouter = require("./routes/user.js")

const dbURL = process.env.ATLASDB_URL;

main()
.then(() => {
    console.log("connected to DB");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(dbURL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended : true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl : dbURL,
    crypto : {
        secret : process.env.SECRET
    },
    touchAfter : 24 * 3600
});

store.on("error", () => {
    console.log("Error in MongoSession Store",err);
});

const sessionOptions = {
    store,
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie : {
        expires : Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
    },
};

app.listen(8181, () => {
    console.log("gurls its working");
})

// app.get("/", (req,res) => {
//     res.send("Its workin...");
// })

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demoUser",async(req,res) => {
//     let fakeUser = new User({
//         email : "stud@gmail.com",
//         username : "student_d1"
//     });
//     let registeredUser = await User.register(fakeUser, "thisisfakeuserpassword");
//     res.send(registeredUser);
// })

app.use("/listings",listingsrouter);
app.use("/listings/:id/review",reviewsrouter);
app.use("/",userouter);


app.all("*",(req,res,next) => {
    next(new ExpressError(404,"Page Not Found"));
});

app.use((err,req,res,next) => {
    let{statusCode = 500, message = "Something Went Wrong"} = err;
    res.status(statusCode).render("error.ejs",{message});
});