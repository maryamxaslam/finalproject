require('dotenv').config();
const express = require('express');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

app.engine('handlebars', expressHandlebars.engine({
    layoutsDir: 'views/layouts',  
    partialsDir: 'views/partials', 
    defaultLayout: 'main',        
    helpers: {
        toLowerCase: str => str.toLowerCase(),
        ifCond: (v1, v2, options) => v1 === v2 ? options.fn(this) : options.inverse(this),
    }
}));
app.set('view engine', 'handlebars');
app.set('views', './views'); 

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' }
}));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', async (req, res) => {
    try {
        let posts = await getPosts(req.query.sort);
        const user = req.session.user || {};
        res.render('partials/home', { posts, user }); 
    } catch (error) {
        console.error('Failed to load posts:', error);
        res.status(500).render('partials/error', { error: 'Failed to load posts' }); 
    }
});

app.get('/login', (req, res) => res.render('partials/login', { loginError: req.query.error })); 
app.get('/register', (req, res) => res.render('partials/login', { regError: req.query.error })); 

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await loginUser(username, password);
    if (user) {
        req.session.user = user;
        res.redirect('/');
    } else {
        res.render('partials/login', { loginError: 'Invalid credentials' }); 
    }
});

app.post('/register', async (req, res) => {
    try {
        const user = await registerUser(req.body.username, req.body.password);
        req.session.user = user;
        res.redirect('/');
    } catch (error) {
        res.render('partials/login', { regError: error.message }); 
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return console.error('Logout failed', err);
        }
        res.redirect('/login');
    });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render('partials/error', { error: 'Internal Server Error' }); 
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

async function getPosts(sortOrder = 'newest') {

    let posts = [
        { id: 1, title: 'Hello World', content: 'This is a blog post', timestamp: new Date() },
        
    ];
    return sortOrder === 'oldest' ? posts.sort((a, b) => a.timestamp - b.timestamp) : posts.sort((a, b) => b.timestamp - a.timestamp);
}

async function loginUser(username, password) {
    const users = [
        { username: 'user1', password: 'pass1' },
    ];
    return users.find(user => user.username === username && user.password === password);
}

async function registerUser(username, password) {
    const users = [
        { username: 'user1', password: 'pass1' },
    ];
    if (users.some(user => user.username === username)) {
        throw new Error('Username is taken');
    }
    const newUser = { username, password };
    users.push(newUser);
    return newUser;
}
