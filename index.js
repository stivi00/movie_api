const express = require('express'),
    fs = require('fs'),
    morgan = require('morgan'),
    path = require('path'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose');

const { check, validationResult } = require('express-validator');
const cors = require('cors');

const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

const app = express();

//middleware to use req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors()); // to allow acces from all domains

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

//connect to the database
mongoose.connect(process.env.CONNECTION_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

//creating a log file
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
    flags: 'a',
});

app.use(morgan('combined', { stream: accessLogStream })); //morgan middleware setup

//serving static page
app.use(express.static('public'));

/**
 * Get the homepage for the movie app.
 *
 * @function
 * @name getHomePage
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {String} - A welcome message indicating the homepage for the movie app.
 * @example
 * // Example response:
 * // "Hi, this is the homepage for the movie app... Welcome!"
 */
app.get('/', (req, res) => {
    res.send('Hi, this is homepage for the movie app... Welcome!');
});

/**
 * Create a new user.
 *
 * @function
 * @name createUser
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - The created user.
 * @throws {Object} 400 - Bad Request if the username already exists.
 * @throws {Object} 500 - Internal Server Error if an error occurs during user creation.
 * @example
 * // Example request body:
 * // {
 * //   "Username": "exampleUser",
 * //   "Password": "examplePassword",
 * //   "Email": "example@email.com",
 * //   "Birthday": "1990-01-01"
 * // }
 *
 * // Example response:
 * // {
 * //   "_id": "5f90d1b63c99c900176c55cf",
 * //   "Username": "exampleUser",
 * //   "Password": "$2b$10$G1t/4xrPt28S9fFgzQYLru.8Ky/FgS.NL/1TjLGS/Bi",
 * //   "Email": "example@email.com",
 * //   "Birthday": "1990-01-01",
 * // }
 */
app.post(
    '/users',
    [
        check('Username', 'Username is required').isLength({ min: 5 }),
        check(
            'Username',
            'Username contains non alphanumeric characters - not allowed.'
        ).isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail(),
    ],
    async (req, res) => {
        let hashedPassword = Users.hashPassword(req.body.Password);
        await Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
            .then((user) => {
                if (user) {
                    //If the user is found, send a response that it already exists
                    return res
                        .status(400)
                        .send(req.body.Username + ' already exists');
                } else {
                    Users.create({
                        Username: req.body.Username,
                        Password: hashedPassword,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday,
                    })
                        .then((user) => {
                            res.status(201).json(user);
                        })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send('Error: ' + error);
                        });
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
    }
);

/**
 * Get all users.
 *
 * @function
 * @name getAllUsers
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - An array of user objects.
 * @throws {Object} 500 - Internal Server Error if an error occurs during user retrieval.
 * @example
 * // Example response:
 * // [
 * //   {
 * //     "_id": "5f90d1b63c99c900176c55cf",
 * //     "Username": "exampleUser1",
 * //     "Password": "$2b$10$G1t/4xrPt28S9fFgzQYLru.8Ky/FgS.NL/1TjLGS/Bi",
 * //     "Email": "example1@email.com",
 * //     "Birthday": "1990-01-01",
 * //   },
 * //   {
 * //     "_id": "5f90d1b63c99c900176c55cg",
 * //     "Username": "exampleUser2",
 * //     "Password": "$2b$10$G1t/4xrPt28S9fFgzQYLru.8Ky/FgS.NL/1TjLGS/Bi",
 * //     "Email": "example2@email.com",
 * //     "Birthday": "1990-01-02",
 * //   },
 * //   // ... More user objects ...
 * // ]
 */
app.get(
    '/users',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        await Users.find()
            .then((user) => {
                res.status(201).json(user);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error ' + err);
            });
    }
);

/**
 * Get a user by username.
 *
 * @function
 * @name getUserByUsername
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - The user object matching the specified username.
 * @throws {Object} 404 - Not Found if the user with the given username is not found.
 * @throws {Object} 500 - Internal Server Error if an error occurs during user retrieval.
 * @example
 * // Example response:
 * // {
 * //   "_id": "5f90d1b63c99c900176c55cf",
 * //   "Username": "exampleUser",
 * //   "Password": "$2b$10$G1t/4xrPt28S9fFgzQYLru.8Ky/FgS.NL/1TjLGS/Bi",
 * //   "Email": "example@email.com",
 * //   "Birthday": "1990-01-01",
 * // }
 */
app.get(
    '/users/:Username',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        await Users.findOne({ Username: req.params.Username })
            .then((user) => {
                res.status(201).json(user);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error ' + err);
            });
    }
);

/**
 * Update a user's information by username.
 *
 * @function
 * @name updateUserByUsername
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - The updated user object.
 * @throws {Object} 400 - Bad Request if the requesting user doesn't have permission.
 * @throws {Object} 404 - Not Found if the user with the given username is not found.
 * @throws {Object} 500 - Internal Server Error if an error occurs during user update.
 * @example
 * // Example request body:
 * // {
 * //   "Username": "newUsername",
 * //   "Password": "newPassword",
 * //   "Email": "new@email.com",
 * //   "Birthday": "1990-02-02"
 * // }
 *
 * // Example response:
 * // {
 * //   "_id": "5f90d1b63c99c900176c55cf",
 * //   "Username": "newUsername",
 * //   "Password": "$2b$10$G1t/4xrPt28S9fFgzQYLru.8Ky/FgS.NL/1TjLGS/Bi",
 * //   "Email": "new@email.com",
 * //   "Birthday": "1990-02-02",
 * // }
 */
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
app.post(
    '/users/:Username/movies/:MovieID',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
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
    }
);

//DELETE
app.delete(
    '/users/:Username/movies/:MovieID',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
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
    }
);

//DELETE
app.delete(
    '/users/:Username/',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        await Users.findOneAndDelete({ Username: req.params.Username })
            .then((user) => {
                if (!user) {
                    res.status(400).send(
                        req.params.Username + ' was not found'
                    );
                } else {
                    res.status(200).send(req.params.Username + ' was deleted.');
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error ' + err);
            });
    }
);

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
app.get(
    '/movies/:Title',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        await Movies.findOne({ Title: req.params.Title })
            .then((movie) => {
                res.status(201).json(movie);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error ' + err);
            });
    }
);

//READ
app.get(
    '/movies/directors/:Director',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        await Movies.findOne({ 'Director.Name': req.params.Director })
            .then((movie) => {
                res.status(201).json(movie.Director);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error ' + err);
            });
    }
);

//READ
app.get(
    '/movies/genres/:genreName',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        await Movies.findOne({ 'Genre.Name': req.params.genreName })
            .then((movie) => {
                // this can be used to filter by genre
                res.status(201).json(movie.Genre);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error ' + err);
            });
    }
);

//error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error has occurred...');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ==> ' + port);
});
