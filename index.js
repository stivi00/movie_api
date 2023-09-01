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

let movies = [
    {
        title: 'The Shawshank Redemption',
        genre: 'Drama',
        description:
            'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
        director: 'Frank Darabont',
        featuring: false,
    },
    {
        title: 'The Godfather',
        genre: 'Crime, Drama',
        description:
            'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
        director: 'Francis Ford Coppola',
        featuring: false,
    },
    {
        title: 'The Dark Knight',
        genre: 'Action, Crime, Drama',
        description:
            'When the menace known as the Joker emerges from his mysterious past, he wreaks havoc and chaos on the people of Gotham.',
        director: 'Christopher Nolan',
        featuring: true,
    },
    {
        title: 'Pulp Fiction',
        genre: 'Crime, Drama',
        description:
            "The lives of two mob hitmen, a boxer, a gangster's wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
        director: 'Quentin Tarantino',
        featuring: true,
    },
    {
        title: 'The Lord of the Rings: The Return of the King',
        genre: 'Adventure, Drama, Fantasy',
        description:
            "Gandalf and Aragorn lead the World of Men against Sauron's army to draw his gaze from Frodo and Sam as they approach Mount Doom with the One Ring.",
        director: 'Peter Jackson',
        featuring: true,
    },
    {
        title: 'Forrest Gump',
        genre: 'Drama, Romance',
        description:
            'The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate, and other historical events unfold through the perspective of an Alabama man with an IQ of 75.',
        director: 'Robert Zemeckis',
        featuring: false,
    },
    {
        title: 'Inception',
        genre: 'Action, Adventure, Sci-Fi',
        description:
            'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        director: 'Christopher Nolan',
        featuring: false,
    },
    {
        title: 'Fight Club',
        genre: 'Drama',
        description:
            'An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more.',
        director: 'David Fincher',
        featuring: true,
    },
    {
        title: 'The Matrix',
        genre: 'Action, Sci-Fi',
        description:
            'A computer programmer discovers a mysterious underground world of mind-bending reality.',
        director: 'Lana Wachowski, Lilly Wachowski',
        featuring: false,
    },
    {
        title: 'Goodfellas',
        genre: 'Biography, Crime, Drama',
        description:
            'The story of Henry Hill and his life in the mob, covering his relationship with his wife and his mob partners.',
        director: 'Martin Scorsese',
        featuring: true,
    },
];

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
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const updatedUser = req.body;

    let user = users.find((user) => user.id == id);

    if (user) {
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(400).send('User not found');
    }
});

//POST
app.post('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;

    let user = users.find((user) => user.id == id);

    if (user) {
        user.topMovies.push(movieTitle);
        res.status(200).send(
            `${movieTitle} has been added to user ${id}'s top movies`
        );
    } else {
        res.status(400).send('User not found');
    }
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
app.delete('/users/:id/', (req, res) => {
    const { id } = req.params;

    let user = users.find((user) => user.id == id);

    if (user) {
        users = users.filter((user) => user.id != id);
        res.status(200).send(`user ${id} has been removed`);
    } else {
        res.status(400).send('User not found');
    }
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
