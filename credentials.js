module.exports ={
    cookieSecret: 'chuhoangson',
    mongo:{
        development:{
            connectionString: 'mongodb://chuhoangson:chuson123@ds035617.mongolab.com:35617/simple'
        },
        production:{
            connectionString: 'mongodb://chuhoangson:chuson123@ds035617.mongolab.com:35617/simple'
        }
    },
    authProviders:{
        facebook:{
            development:{
                appId:'446906415484442',
                appSecret:'f4f154478d932ba1d6873a03510d3c82',
                redirect_uri:'http://localhost:3000/'
            }
        },
        google:{
            development:{
                appId:'1041106732841-f228s5bco39dvo8is9efu2lhnkcn8luv.apps.googleusercontent.com',
                appSecret:'PHVOgY3PQOR-6wiEuEBochBn',
                redirect_uri: 'http://localhost:3000/acount'
            }
        }
    }
};