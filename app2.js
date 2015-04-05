var express = require('express');
var path = require('path');
var app=express();
var formidable=require('formidable');
var http = require('http').Server(app);
var fs = require('fs');
//Cookies
var credentials = require('./credentials.js');
app.use(require('cookie-parser')(credentials.cookieSecret));
// MongoDB Session
var MongoSessionStore = require('session-mongoose')(require('connect'));
var sessionStore = new MongoSessionStore({url: credentials.mongo.development.connectionString});
//SocketIO
var io = require('socket.io')(http);
//vhost
var vhost=require('vhost');
var admin=express.Router();
app.use(vhost('admin.*',admin));
admin.get('/',function(req,res){
    res.send('Hi yoooi admin');
});
admin.get('/users',function(req,res){
    res.send('Hi yoooi admin to users');
});

// Sessions
app.use(require('express-session')({
    secret:credentials.cookieSecret,
    // MongoDB.....
    store: sessionStore,
    saveUninitialized: true, // (default: true)
    resave: true
}));
var mongoose = require('mongoose');
var Vacation = require('./models/vacation.js');
var VacationInSeasonListener = require('./models/vacationInSeasonListener.js');
var opts = {
    server:{
        socketOptions:{keepAlive:1}
    }
};
switch(app.get('env')){
    case 'development':
        mongoose.connect(credentials.mongo.development.connectionString, opts);
        break;
    case 'production':
        mongoose.connect(credentials.mongo.production.connectionString, opts);
        break;
    default:
        throw new Error('Unknown execution environment: '+app.get('env'));
}


app.set('port', process.env.PORT || 3000);

//set engine. In this case: JADE
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));

//Middleware to parse POST request body
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(function(req,res,next){
    // create a domain for the request
    var domain = require('domain').create();
    //handle errors on this domain
    domain.on('error',function(err){
        console.error('DOMAIN ERROR CAUGHT\n', err.stack);
        try{
            setTimeout(function(){
                console.error('Failsafe shutdown');
                process.exit(1);
            },5000);

            // disconnect from the cluster
            var worker = require('cluster').worker;
            if (worker) worker.disconnect();
            // stop taking new request by closing the server
            server.close();
            // attempt to use Express error route
            try{
                next(err);
            }catch(err){
                console.log('Express error mechanism failed./n', err.stack);
                res.statusCode = 500;
                res.type('text/plain');
                res.end('Server error.');
            }
        }catch(err){
            console.log('Unable to send 500 response./n', err.stack);
        }
    });
    domain.add(req);
    domain.add(res);

    domain.run(next);
});

app.use(function(req, res, next){
    //Middleware to detect errors
    //console.log('Current environment: '+app.get('env'));
    res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
    //Middleware to add 'flash' object
    //If there's a flash message, transfer it to the context, then clear it
    res.locals.flash = req.session.flash;
    delete req.session.flash;

    // Cluster....
    var cluster = require('cluster');
    if (cluster.isWorker) console.log('Worker %d received request', cluster.worker.id);

    next();
});

var oneQuote = require('./lib/favouriteQuotes.js');
//index page
app.get('/',function(req,res){
    //res.type('text/html');
    //res.send('Ohana is family');
    //var randomQuoteRES = quotes[Math.floor(Math.random()*quotes.length)];
    var s='';
    for (var thing in req.headers) s+=thing+' : '+req.headers[thing]+'<br>';
    res.render('index',{
        title:'Hello Ohana',
        randomQuote: oneQuote.getQuote(),
        reqInfo:s
    });

});



app.get('/fail',function(req,res){
    throw new Error('Nope!');
});
app.get('/epic-fail',function(req,res){
    process.nextTick(function(){
        throw new Error('Kaboom');
    });

});

function convertFromUSB(value, currency){
    switch(currency){
        case 'USD': return value*1;
        case 'GBP': return value *0.6;
        case 'BTC': return value *0.0023;
        default: return NaN;
    }
}
// "vactions" page
app.get('/vacations',function(req,res){
    Vacation.find({available:true},function(err,vacations){
        var currency = req.session.currency || 'USD';
        var toSend = {
            vacations: vacations.map(function(a){
                // return {
                //     sku: a.sku,
                //     name: a.name,
                //     description: a.description,
                //     price: a.getDisplayPrice(),
                //     inSeason: a.inSeason
                // };
                a.price = convertFromUSB(a.priceInCents/100,currency);
                return a;
            }),
        };
        res.render('vacations',toSend);
    });
});
app.get('/set-currency/:currency',function(req,res){
    req.session.currency = req.params.currency;
    res.redirect(303, '/vacations');
});
//test Session page
app.get('/testSession',function(req,res){
    console.log('GET at testSession');
    req.session.a_session = 'Hey does it work?';
    res.render('layout-for-form',{
        title:'Form',
        actionForm:'testSession'
    });
});
app.post('/testSession',function(req,res){
    console.log('POST at testSession');
    console.log(req.session.a_session);
    res.render('layout-for-form',{
        title:'Form'
    });
});

//"Form" page
app.get('/basicform',function(req,res){
    res.cookie('a_thing','Shit happen everytime');
    res.cookie('a_thing','Shit happen everytime twice',{signed:true});
    res.render('layout-for-form',{
        title:'Form',
        actionForm:'receivedForm'
    });
});
app.post('/basicform/receivedForm',function(req,res){
    console.log(req.body);
    console.log(req.cookies.a_thing);
    console.log(req.signedCookies.a_thing);
    res.type('text/plain');
    res.json({'item':'This is what you get bitch'});
    //res.redirect(303,'/kiitos');
});

//Handling file uploads
app.get('/contest/vacation-photo',function(req,res){
    var now = new Date();
    res.render('contest/vacation-photo',{
        year:now.getFullYear(),
        month:now.getMonth()+1
    });
});
var dataDir = __dirname+'/data';
var vacationPhotoDir = dataDir+'/vacation-photo';
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

function saveContestEntry(contestName, email, year, month, photoPath){
    // TODOO... this will come later
}

app.post('/contest/vacation-photo/:year/:month',function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req,function(err,fields,files){
        if (err) return res.redirect(303,'/error');
        else{
            // console.log('received fields: ');
            // console.log(fields);
            // console.log('received files: ');
            // console.log(files);
            // res.type('text/plain');
            // res.send('awesome');
            var photo = files.photo;
            var dir = vacationPhotoDir + '/' +Date.now();
            var pathE = dir+ '/' +photo.name;
            console.log(photo);

            console.log('pathE: '+pathE);
            fs.mkdirSync(dir);
            // fs.renameSync(photo.path, pathE);
            // move the file to the directory (pathE) and also rename it
            var is = fs.createReadStream(photo.path);
            var os = fs.createWriteStream(pathE);
            is.pipe(os);
            is.on('end',function() {
                fs.unlinkSync(photo.path);
            });

            saveContestEntry('vacation-photo', fields.email, req.params.year, req.params.month, pathE);
            return res.redirect(303, '/contest/vacation-photo/entries');
        }
    });
});

//SocketIO application
app.get('/chat',function(req,res){
    res.render('chat/chat-window');
});
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
});

// Facebook Authentication
var auth = require('./lib/auth.js')(app,{
    providers: credentials.authProviders,
    successRedirect: '/acount',
    failureRedirect: '/unauthorized'
});
auth.init();
auth.registerRoutes();

// Google Authentication
var authGoogle = require('./lib/authGoogle.js')(app,{
    providers: credentials.authProviders,
    successRedirect: '/acount',
    failureRedirect: '/unauthorized'
});
authGoogle.init();
authGoogle.registerRoutes();

app.get('/acount',function(req,res){
    //console.log(req.user);
    if (!req.session.passport.user)
        return res.redirect(303,'/unauthorized');
    //res.type('text/plain').send(req.session.passport.user);
    var User = require('./models/user.js');
    User.findOne({_id: req.session.passport.user},function(err,user){
        if (err) throw err;
        res.render('layout',{title: "Logged in", user: user});
    });
});

// "About" page
app.get('/about',function(req,res){
    //res.type('text/plain');
    //res.send('About Ohana');
    res.render('layout',{title:'About', pageTestScript:'/qa/tests-about.js'});
});


/*
    The order of routes are VERY significant in NodeJS Express.
    The route for 404 page MUST be put before (above) 505 page
*/

//Custom 404 page
app.use(function(req,res,next){
    //res.type('text/plain');
    res.status(404);
    //res.send('404 - Not Found');
    var errorRES = {
        status:404,
        stack:''
    };
    res.render('error',{
        message: '404 - NOT FOUND BITCH',
        error:errorRES
    });
});
// Error 500 page
app.use(function(err,req,res,next){
    console.error(err.stack);
    //res.type('text/plain');
    res.status(500);
    //res.send('500 - Server Error');
    res.render('error',{
        message: '500 - ERROR BITCH',
        error:err
    });
});


function startServer(){
    http.listen(app.get('port'), function(){
        console.log('Express start in '+app.get('env')+' mode on http://localhost:'+app.get('port')+'; Ctrl + C to terminate');
    });
}

if (require.main === module){
    startServer();
}else{
    module.exports = startServer;
}
// app.listen(app.get('port'),function(){
//     console.log('Express started on http://localhost:'+app.get('port')+'; press Ctrl-C to terminate');
// });