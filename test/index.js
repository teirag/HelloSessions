'use strict';
const expect                = require('chai').expect;
const express               = require('express');
const assignment            = require('../index.js');
const Request               = require('request');

const domain = 'http://localhost:3000/';

describe('hello-sessions', function() {

    before(() => {
        process.stdout.write('Waiting for server');
        return waitForConnection();
    });


    describe('not authenticated', () => {

        it('GET / returns 401', () => {
            return request({ url: domain })
                .then(res => {
                    expect(res.statusCode).to.equal(401);
                });
        });

        it('PUT / returns 401', () => {
            return request({ url: domain })
                .then(res => {
                    expect(res.statusCode).to.equal(401);
                });
        });

        it('DELETE / returns 401', () => {
            return request({ url: domain })
                .then(res => {
                    expect(res.statusCode).to.equal(401);
                });
        });

    });

    userTests();
    userTests();
    userTests();


});

function getData(jar) {
    const req = {
        method: 'GET',
        url: domain,
        jar: jar,
        json: true
    };
    return request(req);
}

function login(username, jar) {
    const req = {
        method: 'POST',
        url: domain + 'login',
        form: {
            username: username,
            password: 'pass'
        },
        jar: jar || false,
        json: true
    };
    return request(req);
}

function randomString() {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let text = "";

    for(let i = 0; i < 5; i++ ) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

function request(config) {
    return new Promise((resolve, reject) => {
        try {
            Request(config, function (err, res) {
                if (err) return reject(err);
                resolve(res);
            });
        } catch (err) {
            reject(err);
        }
    });
}

function userTests() {
    const name = randomString();
    const addKey = randomString();
    const data = {};

    describe('login as ' + name, () => {
        let jar;

        before(() => {
            jar = Request.jar();
        });

        it('can login', () => {
            return login(name).then(res => {
                expect(res.statusCode).to.equal(200);
            });
        });

        it('login returns user data', () => {
            return login(name, jar).then(res => {
                expect(res.body).to.deep.equal(data);
            });
        });

        it('can add data', () => {
            const req = {
                method: 'PUT',
                url: domain,
                jar: jar,
                json: true,
                qs: {
                    key: addKey,
                    value: randomString()
                }
            };
            data[req.qs.key] = req.qs.value;
            return request(req).then(res => {
                expect(res.body).to.deep.equal(data);
            });
        });

        it('can add more data', () => {
            const req = {
                method: 'PUT',
                url: domain,
                jar: jar,
                json: true,
                qs: {
                    key: randomString(),
                    value: randomString()
                }
            };
            data[req.qs.key] = req.qs.value;
            return request(req).then(res => {
                expect(res.body).to.deep.equal(data);
            });
        });

        it('get data shows added', () => {
            return getData(jar).then(res => {
                expect(res.body).to.deep.equal(data);
            });
        });

        it('can delete data', () => {
            const req = {
                method: 'DELETE',
                url: domain,
                jar: jar,
                json: true,
                qs: {
                    key: addKey
                }
            };
            delete data[addKey];
            return request(req).then(res => {
                expect(res.body).to.deep.equal(data);
            });
        });

        it('get data shows deleted', () => {
            const req = {
                method: 'GET',
                url: domain,
                jar: jar,
                json: true
            };
            return request(req).then(res => {
                expect(res.body).to.deep.equal(data);
            });
        });

        it('can logout', () => {
            const req = {
                method: 'GET',
                url: domain + 'logout',
                jar: jar
            };
            return request(req)
                .then(res => getData(jar))
                .then(res => {
                    expect(res.statusCode).to.equal(401);
                });
        });

        it('can log back in', () => {
            return login(name, jar).then(res => {
                expect(res.body).to.deep.equal(data);
            });
        });

    });
}

function wait(delay) {
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    });
}

function waitForConnection() {
    process.stdout.write('.');
    return request({ method: 'GET', url: domain + 'health' })
        .then(
            res => {
                console.log('Server ready');
            }, err => {
                return wait(250).then(() => waitForConnection());
            }
        );
}
