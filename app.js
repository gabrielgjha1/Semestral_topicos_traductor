'use strict';
require('dotenv').config({ silent: true });
const express = require('express');
const app = express();
const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');
const { IamAuthenticator } = require('ibm-watson/auth');
var path = require('path');

const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');

// Bootstrap application settings
require('./config/express')(app);

// Create the service wrapper


const ibmClient = new TextToSpeechV1({
    authenticator: new IamAuthenticator({ apikey: process.env.TEXT_TO_SPEECH_API_KEY }),
    version: '2020-04-01',
    url: process.env.TEXT_TO_SPEECH_URL,

});



const translator = new LanguageTranslatorV3({
    version: '2019-10-10',
    authenticator: new IamAuthenticator({
        apikey: process.env.LANGUAGE_TRANSLATOR_IAM_APIKEY,
    }),
    url: process.env.LANGUAGE_TRANSLATOR_URL,
    headers: {
        'X-Watson-Technology-Preview': '2018-05-01',
        'X-Watson-Learning-Opt-Out': true,
    },
});

// render index page
app.get('/', function(req, res) {
    // If hide_header is found in the query string and is set to 1 or true,
    // the header should be hidden. Default is to show header
    res.render('index', {
        hideHeader: !!(req.query.hide_header == 'true' || req.query.hide_header == '1'),
    });
});







app.get('/api/models', function(req, res, next) {
    console.log('/v3/models');
    translator
        .listModels()
        .then(({ result }) => res.json(result))
        .catch(error => next(error));
});

app.post('/api/identify', function(req, res, next) {
    console.log('/v3/identify');
    translator
        .identify(req.body)
        .then(({ result }) => res.json(result))
        .catch(error => next(error));
});

app.get('/api/identifiable_languages', function(req, res, next) {
    console.log('/v3/identifiable_languages');
    translator
        .listIdentifiableLanguages(req.body)
        .then(({ result }) => res.json(result))
        .catch(error => next(error));
});

app.post('/api/translate', function(req, res, next) {
    console.log('/v3/translate');
    translator
        .translate(req.body)
        .then(({ result }) => res.json(result))
        .catch(error => next(error));
});

app.get('/api/voces', async(_, res, next) => {
    console.log("holasadasdasd");
    try {
        if (ibmClient) {
            const { result } = await ibmClient.listVoices();
            return res.json(result);
        } else {
            // Return Allison for testing and user still gets creds pop-up.
            return res.json({
                voices: [{
                    name: 'es-ES_EnriqueV3Voice',
                    description: 'Enrique: American English female voice. Dnn technology.',
                }]
            });
        }
    } catch (err) {
        console.error(err);
        if (!client) {
            err.statusCode = 401;
            err.description = 'no se pueden encontrar credenciales validas para el servicio de IBM.';
            err.title = 'Credenciales Invalidad';
        }
        next(err);
    }
});

app.get('/api/sintetizar', async(req, res, next) => {
    
    req.query.accept = "audio/mp3"
    console.log(req.query);

    try {
        const { result } = await ibmClient.synthesize(req.query);
        result.pipe(res);
    } catch (err) {
        //   console.error(err);
        if (!ibmClient) {
            err.statusCode = 401;
            err.description = 'no se pueden encontrar credenciales validas para el servicio de IBM.';
            err.title = 'Credenciales Invalidad';
        }
        next(err);
    }
});

// express error handler
require('./config/error-handler')(app);
module.exports = app;