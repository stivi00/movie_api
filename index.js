const express = require('express');
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
const app = express();

let movies = [
    {
        title: 'The Shawshank Redemption',
        genre: 'Drama',
        description:
            'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
        director: 'Frank Darabont',
    },
    {
        title: 'The Godfather',
        genre: 'Crime, Drama',
        description:
            'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
        director: 'Francis Ford Coppola',
    },
    {
        title: 'The Dark Knight',
        genre: 'Action, Crime, Drama',
        description:
            'When the menace known as the Joker emerges from his mysterious past, he wreaks havoc and chaos on the people of Gotham.',
        director: 'Christopher Nolan',
    },
    {
        title: 'Pulp Fiction',
        genre: 'Crime, Drama',
        description:
            "The lives of two mob hitmen, a boxer, a gangster's wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
        director: 'Quentin Tarantino',
    },
    {
        title: 'The Lord of the Rings: The Return of the King',
        genre: 'Adventure, Drama, Fantasy',
        description:
            "Gandalf and Aragorn lead the World of Men against Sauron's army to draw his gaze from Frodo and Sam as they approach Mount Doom with the One Ring.",
        director: 'Peter Jackson',
    },
    {
        title: 'Forrest Gump',
        genre: 'Drama, Romance',
        description:
            'The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate, and other historical events unfold through the perspective of an Alabama man with an IQ of 75.',
        director: 'Robert Zemeckis',
    },
    {
        title: 'Inception',
        genre: 'Action, Adventure, Sci-Fi',
        description:
            'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        director: 'Christopher Nolan',
    },
    {
        title: 'Fight Club',
        genre: 'Drama',
        description:
            'An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more.',
        director: 'David Fincher',
    },
    {
        title: 'The Matrix',
        genre: 'Action, Sci-Fi',
        description:
            'A computer programmer discovers a mysterious underground world of mind-bending reality.',
        director: 'Lana Wachowski, Lilly Wachowski',
    },
    {
        title: 'Goodfellas',
        genre: 'Biography, Crime, Drama',
        description:
            'The story of Henry Hill and his life in the mob, covering his relationship with his wife and his mob partners.',
        director: 'Martin Scorsese',
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

//READ
app.get('/movies', (req, res) => {
    res.status(200).json(movies);
});

app.get('/movies/:title', (req, res) => {
    const { title } = req.params;
    const movie = movies.find((movie) => movie.title === title);

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('no szuch movie');
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
