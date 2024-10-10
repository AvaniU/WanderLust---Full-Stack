    const { model } = require("mongoose");
    const mongoose = require('mongoose');
    const Listing = require("../models/listing.js");
    const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
    const mapToken = process.env.MAP_TOKEN;
    const geocodingClient = mbxGeocoding({ accessToken:mapToken });

    module.exports.index = async (req, res) => {
        try {
            // Extract query parameters
            const { country, keyword, category } = req.query;
    
            // Initialize the query object
            let query = {};
    
            // Filter by country if provided
            if (country) {
                query.country = country;
            }
    
            // Filter by keyword if provided
            if (keyword) {
                query.keywords = { $regex: new RegExp(keyword, 'i') }; // Case-insensitive search
            }
    
            // Filter by category if provided
            if (category) {
                query.keywords = query.keywords ? { $all: [category], $regex: query.keywords.$regex } : { $all: [category] };
            }
    
            // Fetch listings based on the constructed query
            const allListings = await Listing.find(query);
    
            // Prepare the message if no listings are found
            const message = allListings.length === 0 ? 'No listings found for the selected filters.' : null;
    
            // Return JSON for AJAX requests or render the page otherwise
            if (req.xhr || req.headers['accept'].includes('application/json')) {
                res.json(allListings);
            } else {
                res.render("listings/index.ejs", { allListings, message });
            }
        } catch (error) {
            console.error(error);
            req.flash('error', 'Something went wrong while fetching listings!');
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
