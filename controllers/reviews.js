const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.createReview = async(req,res) => {
    try {
        const listingId = req.params.id;
        let listing = await Listing.findById(listingId);

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect('/listings');
        }

        // Create a new review and set the author
        let newReview = new Review(req.body.review);
        newReview.author = req.user._id; // Ensure this is set correctly

        await newReview.save();

        // Add the new review to the listing
        listing.review.push(newReview);
        await listing.save();

        req.flash("success", "New Review Created!");
        res.redirect(`/listings/${listingId}`);
    } catch (error) {
        console.error(error);
        req.flash("error", "Something went wrong!");
        res.redirect(`/listings/${req.params.id}`);
    }
}

module.exports.deleteReview = async(req,res) => {
    try {
        let{id,reviewId} = req.params;
        await Listing.findByIdAndUpdate(id,{$pull : {review : reviewId}})
        await Review.findByIdAndDelete(reviewId);
        req.flash("success","Review Deleted!");
        res.redirect(`/listings/${id}`);
    } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong!');
        res.redirect('/listings');
    }
}