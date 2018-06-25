'use strict';

module.exports = app => {
    app.router.get('/egg/', app.controller.home.render);
    app.router.get('/egg/home', app.controller.home.render);
    app.router.get('/egg/foo', app.controller.foo.render);
};

