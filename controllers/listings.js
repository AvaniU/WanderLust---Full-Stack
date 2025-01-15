const { model } = require("mongoose");
const mongoose = require('mongoose');
const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken:mapToken });

module.exports.checkKeywords = async (req, res) => {
    try {
        const listings = await Listing.find({});
        const keywordMap = {};
        
        listings.forEach(listing => {
            listing.keywords.forEach(keyword => {
                keywordMap[keyword] = (keywordMap[keyword] || 0) + 1;
            });
        });
        
        res.json(keywordMap);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// listingController.js
module.exports.index = async (req, res) => {
    try {
        const { keyword } = req.query;
        let query = {};

        if (keyword && keyword !== 'all') {
            // Update query to search within the keywords array
            query = { keywords: keyword };
        }

        const allListings = await Listing.find(query);
        
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json(allListings);
        }

        res.render("listings/index.ejs", { 
            allListings,
            message: allListings.length === 0 ? 'No listings found for the selected filters.' : null
        });
    } catch (error) {
        console.error('Error in listings index:', error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ error: 'Failed to fetch listings' });
        }
        req.flash('error', 'Failed to fetch listings');
        res.redirect('/listings');
    }
};


module.exports.renderNewFrom = (req,res) => {
    res.render("listings/new.ejs");
}

module.exports.showListing = async (req, res) => {
    try {
        const listingId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(listingId)) {
            return res.status(400).send('Invalid Listing ID');
        }
        const listing = await Listing.findById(listingId)
            .populate({
                path: 'review',
                populate: {
                    path: 'author',
                    select: 'username' // Ensure you select the `username` field
                }
            })
            .populate('owner');

        if (!listing) {
            req.flash('error', 'Listing requesting to be accessed is absent!');
            return res.redirect('/listings');
        }

        res.render('listings/show.ejs', { listing });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong!');
        res.redirect('/listings');
    }
};

module.exports.createListing = async(req,res,next) => {
    try {
        let response = await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1
          })
            .send()

        const newListing = new Listing(req.body.listing);
        let url = req.file.path;
        let filename = req.file.filename;

        newListing.image = {url,filename};
        newListing.owner=req.user._id;
        newListing.geometry=response.body.features[0].geometry;

        let savedListing = await newListing.save();
        console.log(savedListing);
        req.flash("success","New Listing Created");
        res.redirect("/listings");
    } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong!');
        res.redirect('/listings');
    }
}

module.exports.editListing = async(req,res) => {
    try {
        let {id} = req.params;
        const listing = await Listing.findById(id);
        if(!listing){
            req.flash("error","Listing requesting to be accessed is absent!");
            res.redirect("/listings");
        }
        let orgurl = listing.image.url;
        orgurl = orgurl.replace("/upload","/upload/  w_250");
        res.render("listings/edit.ejs",{listing,orgurl});
    } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong!');
        res.redirect('/listings');
    }
}

module.exports.updateListing = async(req,res) => {
    try {
        let {id} = req.params;
        let listing = await Listing.findByIdAndUpdate(id,{ ...req.body.listing });
        
        if(typeof req.file!="undefined"){
            let url = req.file.path;
            let filename = req.file.filename;
            listing.image = {url,filename};
            await listing.save();
        }

        req.flash("success","Listing Updated!");
        res.redirect(`/listings/${id}`);
    } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong!');
        res.redirect('/listings');
    }
}

module.exports.deleteListing = async(req,res) => {
    try {
        let {id} = req.params;
        let deletedListing = await Listing.findByIdAndDelete(id);
        req.flash("success","Listing Deleted!");
        res.redirect("/listings");
    } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong!');
        res.redirect('/listings');
    }
}
