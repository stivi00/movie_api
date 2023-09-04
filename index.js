const express = require('express'),
    fs = require('fs'),
    morgan = require('morgan'),
    path = require('path'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');
mongoose = require('mongoose');

const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

const app = express();

//middleware to use req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // not sure why this

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

//connect to the database
mongoose.connect('mongodb://127.0.0.1:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

//creating a log file
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
    flags: 'a',
});

//morgan middleware setup
app.use(morgan('combined', { stream: accessLogStream }));

//serving static page
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Hi, this is homepage for the movie app... Welcome!');
});

//CREATE
app.post('/users', async (req, res) => {
    await Users.findOne({ Username: req.body.Username })
        .then((user) => {
            if (user) {
                return res
                    .status(400)
                    .send(req.body.Username + 'already exists');
            } else {
                Users.create({
                    Username: req.body.Username,
                    Password: req.body.Password,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday,
                })
                    .then((user) => {
                        res.status(201).json(user);
                    })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send('Error ' + error);
                    });
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error ' + error);
        });
});

//READ USERS
app.get('/users', async (req, res) => {
    await Users.find()
        .then((user) => {
            res.status(201).json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err);
        });
});

//READ ONE USER
app.get('/users/:Username', async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.status(201).json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err);
        });
});

//UPDATE
app.put(
    '/users/:Username',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // CONDITION TO CHECK ADDED HERE
        if (req.user.Username !== req.params.Username) {
            return res.status(400).send('Permission denied');
        }
        // CONDITION ENDS
        await Users.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $set: {
                    Username: req.body.Username,
                    Password: req.body.Password,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday,
                },
            },
            { new: true }
        ) // This line makes sure that the updated document is returned
            .then((updatedUser) => {
                res.json(updatedUser);
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//POST - add a movie to a user's fav list
app.post('/users/:Username/movies/:MovieID', async (req, res) => {
    await Users.findOneAndUpdate(
        { Username: req.params.Username },
        {
            $push: { FavoriteMovies: req.params.MovieID },
        },
        { new: true }
    ) // This line makes sure that the updated document is returned
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//DELETE
app.delete('/users/:Username/movies/:MovieID', async (req, res) => {
    Users.findOneAndUpdate(
        { Username: req.params.Username },
        { $pull: { FavoriteMovies: req.params.MovieID } },
        { new: true }
    )
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//DELETE
app.delete('/users/:Username/', async (req, res) => {
    await Users.findOneAndDelete({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + ' was not found');
            } else {
                res.status(200).send(req.params.Username + ' was deleted.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err);
        });
});

//READ
app.get(
    '/movies',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        await Movies.find()
            .then((movies) => res.status(200).send(movies))
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//READ
app.get('/movies/:Title', async (req, res) => {
    await Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.status(201).json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err);
        });
});

//READ
app.get('/movies/directors/:Director', async (req, res) => {
    await Movies.findOne({ 'Director.Name': req.params.Director })
        .then((movie) => {
            res.status(201).json(movie.Director);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err);
        });
});

//READ
app.get('/movies/genres/:genreName', async (req, res) => {
    await Movies.findOne({ 'Genre.Name': req.params.genreName })
        .then((movie) => {
            // this can be used to filter by genre
            res.status(201).json(movie.Genre);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error ' + err);
        });
});

//error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error has occurred...');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
