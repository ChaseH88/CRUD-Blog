var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override")
var expressSanitizer = require("express-sanitizer")
// ======================= for image upload - start =======================
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
   destination: function (req, file, cb) {
    cb(null, "uploads");
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({
    storage: storage,
    fileFilter: imageFilter
})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'chaseh88', // Cloud Name
  api_key: '899273552835847', // API Key
  api_secret: 'q4aMbQjo-BruzOxOHXbwuDoWwMg' // API Secret
});
// ======================= for image upload - end =======================

// ------------App config------------
mongoose.connect("mongodb://localhost/restful_blog_app");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

// ------------Schema------------
var blogSchema = ({
    title: String,
    image: String,
    body: String,
    created: {type: Date, default: Date.now} // { userInput, default data }
});

var Blog = mongoose.model("Blog", blogSchema);


// ------------Routes------------
// Home Page, redirects to blog page
app.get("/", function(req, res) {
    res.redirect("/blogs");
});

// blog page, gets data and matches to variable so we can use it
// INDEX ROUTE
app.get("/blogs", function(req, res) {
    Blog.find({}, function(err, blogs) {
       if(err){
           console.log(err);
       } else {
           res.render("index", {blogs : blogs});
       }
    });
});

// NEW ROUTE
app.get("/blogs/new", function(req, res) {
    res.render("new");
})

// CREATE ROUTE
app.post("/blogs", upload.single('blog[image]'), function(req, res){
// add cloudinary url for the image to the campground object under image property
  req.body.blog.image = req.file.path
  console.log("-------req.body.blog.image------------");
  console.log(req.body.blog.image);
  console.log("-------------------");
//   add author to campground
//   req.body.blog.author = {
//     id: req.user._id,
//     username: req.user.username
//   }
  Blog.create(req.body.blog, function(err, newBlog) {
    console.log("---------newBlog----------");
    console.log(newBlog);
    console.log("-------------------");
    if (err) {
      //req.flash('error', err.message);
      return res.redirect('back');
    }
    res.redirect("/blogs");
  });
});


// SHOW ROUTE
app.get("/blogs/:id", function(req, res){
   Blog.findById(req.params.id, function(err, foundBlog){
      if(err){
          console.log(err);
          res.redirect("/blogs");
      } else {
          res.render("show", {blog : foundBlog});
      }
   });
});

// EDIT ROUTE
app.get("/blogs/:id/edit", function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            console.log(err);
            res.redirect("/blogs");
        } else {
            res.render("edit", {blog : foundBlog});
        }
    });
})

// UPDATE ROUTE
app.put("/blogs/:id", function(req, res){
    //Sanitize, request.dataFromForm.database.whatInTheDatabase
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
      if(err){
          console.log(err);
          res.redirect("/blogs");
      } else {
          res.redirect("/blogs/" + req.params.id);
      }
   });
});

// DELETE ROUTE
app.delete("/blogs/:id", function(req, res){
    // destroy blog and redirect
    Blog.findByIdAndRemove(req.params.id, function(err){
       if(err){
           console.log(err);
           res.redirect("/blogs");
       } else {
           res.redirect("/blogs");
       }
    });
});

// Always required, listens for request from the user
app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Server has started");
});