const express = require('express');
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
const app = express();

let topMovies = [
    {
        title: 'The Shawshank Redemption',
        year: 1994,
    },
    {
        title: 'The Godfather',
        year: 1972,
    },
    {
        title: 'The Dark Knight',
        year: 2008,
    },
    {
        title: 'Pulp Fiction',
        year: 1994,
    },
    {
        title: "Schindler's List",
        year: 1993,
    },
    {
        title: 'The Lord of the Rings: The Return of the King',
        year: 2003,
    },
    {
        title: 'Fight Club',
        year: 1999,
    },
    {
        title: 'Inception',
        year: 2010,
    },
    {
        title: 'Forrest Gump',
        year: 1994,
    },
    {
        title: 'The Matrix',
        year: 1999,
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

//ROUTES START ===>
app.get('/', (req, res) => {
    res.send('Hi, this is homepage for the movie app... Welcome!');
});

app.get('/movies', (req, res) => {
    res.status(200).json(topMovies);
});
// ROUTES END <===

//error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error has occurred...');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});
