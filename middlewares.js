const Listing = require("./models/listing");
const ExpressError = require("./util/ExpressError.js");
const {listingSchema} = require("./schema.js");
const {reviewSchema} = require("./schema.js");
const Review = require("./models/review.js");

module.exports.isLoggedIn = (req,res,next) => {
    if(!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","You must be logged in to create listing!");
        return res.redirect("/signin");
    }
     next();
};

module.exports.saveRedirectUrl = (req,res,next) => {
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl
    }
    next();
}

module.exports.isOwner = async(req,res,next) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","You are not authorized");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.validateListing = (req,res,next) => {
    let {error} = listingSchema.validate(req.body);
    // let{title,description,image,price,country,location} = req.body;
    if(error){
        let errMsg = error.details.map((el) => el.message).join(","); 
        throw new ExpressError(400, errMsg);
    }else{
        next(); 
    }
}


module.exports.validateReview = (req,res,next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(","); 
        throw new ExpressError(400, errMsg);
    }else{
        next(); 
    }
}

module.exports.isReviewAuthor = async(req,res,next) => {
    let {reviewId} = req.params;
    let review = await Listing.findById(reviewId).populate("author");
    if(!review){
        req.flash("Error", "Review not found");
        return res.redirect("/listings");
    }
    if(!review.author || !res.locals.currUser || !review.author.equals(res.locals.currUser._id)){
        req.flash("error","You are not authorized");
        return res.redirect(`/listings/${id}`);
    }
    next();
}