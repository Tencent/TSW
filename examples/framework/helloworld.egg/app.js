'use strict';

const options = {
    baseDir: __dirname,
    plugin: null
};

const { EggCore: Application } = require('egg-core');
const app = new Application(options);

app.loader.loadConfig();
app.loader.loadController();


require('./app/router')(app);


module.exports = app;

