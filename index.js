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
app.put('/users/:Username', async (req, res) => {
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
    )
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

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
app.delete('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;

    let user = users.find((user) => user.id == id);

    if (user) {
        user.topMovies = user.topMovies.filter((title) => title !== movieTitle);
        res.status(200).send(
            `${movieTitle} has been removed from user ${id}'s top movies`
        );
    } else {
        res.status(400).send('User not found');
    }
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
app.get('/movies', (req, res) => {
    res.status(200).json(movies);
});

//READ
app.get('/movies/:title', (req, res) => {
    const { title } = req.params;
    const movie = movies.find((movie) => movie.title === title);

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('No such movie.');
    }
});

//READ
app.get('/movies/directors/:director', (req, res) => {
    const { director } = req.params;
    const movie = movies.find((movie) => movie.director === director);

    if (movie) {
        res.status(200).json(movie.director);
    } else {
        res.status(400).send('No such director.');
    }
});

//READ
app.get('/movies/genres/:genre', (req, res) => {
    const { genre } = req.params;
    const movie = movies.find((movie) => movie.genre === genre);

    if (movie) {
        res.status(200).json(movie.genre);
    } else {
        res.status(400).send('No such genre.');
    }
});

//error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error has occurred...');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
