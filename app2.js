var express = require('express');
var path = require('path');
var app=express();

app.set('port', process.env.PORT || 3000);
//console.log(process.env.PORT);

//set engine. In this case: JADE
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));


var quotes =[
    "Do at least 1 thing that you fear.",
    "Keep things simply.",
    "Give value!"];
//index page
app.get('/',function(req,res){
    //res.type('text/html');
    //res.send('Ohana is family');
    var randomQuoteRES = quotes[Math.floor(Math.random()*quotes.length)];
    res.render('index',{
        title:'Hello Ohana',
        randomQuote: randomQuoteRES
    });

});
// about page
app.get('/about',function(req,res){
    //res.type('text/plain');
    //res.send('About Ohana');
    res.render('layout',{title:'About'});
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

app.listen(app.get('port'),function(){
    console.log('Express started on http://localhost:'+app.get('port')+'; press Ctrl-C to terminate');
});