var User =require('../models/user.js');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.serializeUser(function(user,done){
    done(null, user._id);
});

passport.deserializeUser(function(id,done){
    User.findById(id,function(err, user){
        if (err || !user) return done(err, null);
        done(null, user);
    });
});

module.exports = function(app, options){
    if (!options.successRedirect) options.successRedirect = '/acount';
    if (!options.failureRedirect) options.failureRedirect = '/login';

    return {
        init:function(){
            var env = app.get('env');
            var config = options.providers;

            // configure Facebook strategy
            passport.use(new GoogleStrategy({
                clientID: config.google[env].appId,
                clientSecret:config.google[env].appSecret,
                callbackURL:'http://localhost:3000/auth/google/callback'
            }, function(accessToken, refreshToken, profile, done){
                var authId = 'google: '+profile.id;
                User.findOne({authId:authId}, function(err,user){
                    if (err) return done(err, null);
                    if (user) return done(null, user);
                    //console.log('Profile: ',profile);
                    user = new User({
                        authId:authId,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        created: Date.now(),
                        role:'customer'
                    });
                    user.save(function(err){
                        if (err) return done(err, null);
                        done(null, user);
                    });
                });
            }));
            app.use(passport.initialize());
            app.use(passport.session());
        },
        registerRoutes: function(){
            // register Facebook routes
            app.get('/auth/google',passport.authenticate('google',{ scope: 'https://www.googleapis.com/auth/plus.profile.emails.read' }));

            app.get('/auth/google/callback', passport.authenticate('google',
                { failureRedirect:options.failureRedirect }),
                function(req, res){
                    //console.log('req: ',req);
                    //console.log('res: ',res);
                    // success
                    res.redirect(303, options.successRedirect);
                    }
            );
        }
    };
};
