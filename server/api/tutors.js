/**
 * Created by supun on 11/01/18.
 */
'use strict';
const AuthPlugin = require('../auth');
const Async = require('async');
const Boom = require('boom');
const EscapeRegExp = require('escape-string-regexp');
const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {

     const User = server.plugins['hapi-mongo-models'].Tutor;
    // const Admin = server.plugins['hapi-mongo-models'].Admin;
    // const Account = server.plugins['hapi-mongo-models'].Account;



    server.route({
        method: 'POST',
        path: '/users',
        config: {
            auth: {
                strategy: 'session',
                scope: 'admin'
            },
            validate: {
                payload: {
                    username: Joi.string().token().lowercase().required(),
                    email: Joi.string().email().lowercase().required(),
                    password: Joi.string().required()
                }
            },
            pre: [
                AuthPlugin.preware.ensureAdminGroup('root'),
                {
                    assign: 'usernameCheck',
                    method: function (request, reply) {

                        const conditions = {
                            username: request.payload.username
                        };

                        User.findOne(conditions, (err, user) => {

                            if (err) {
                                return reply(err);
                            }

                            if (user) {
                                return reply(Boom.conflict('Username already in use.'));
                            }

                            reply(true);
                        });
                    }
                }, {
                    assign: 'emailCheck',
                    method: function (request, reply) {

                        const conditions = {
                            email: request.payload.email
                        };

                        User.findOne(conditions, (err, user) => {

                            if (err) {
                                return reply(err);
                            }

                            if (user) {
                                return reply(Boom.conflict('Email already in use.'));
                            }

                            reply(true);
                        });
                    }
                }
            ]
        },
        handler: function (request, reply) {

            const username = request.payload.username;
            const password = request.payload.password;
            const email = request.payload.email;

            User.create(username, password, email, (err, user) => {

                if (err) {
                    return reply(err);
                }

                reply(user);
            });
        }
    });





    next();
};


exports.register = function (server, options, next) {

    server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

    next();
};


exports.register.attributes = {
    name: 'users'
};
