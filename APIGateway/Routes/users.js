'use strict';

const jwt = require('jsonwebtoken');
const express = require('express');
const withAuth = require('../Middleware/auth');
const MSCall = require('../Utilities/MSCall');
const user = express.Router();
var api = new MSCall();
api.setPrefixURL('http://localhost:9000');
var firebaseAPI = new MSCall();
firebaseAPI.setPrefixURL('http://localhost:8000');

// Register
user.post('/register', async (req, res) => {
    const response = await api.call('user/register/', 'POST', { json: req.body });
    if (response.status !== 200) return res.status(response.status).end();
    else {
        jwt.sign(response.body, 'Secret', { expiresIn: '30m' }, (err, token) => {
            if (err) return res.sendStatus(500).end();
            res.cookie('token', token, { httpOnly: true });
            res.cookie('userData', { username: req.body.username });
            res.status(200).end();
        });
    }
});

// Log In
user.post('/login', async (req, res) => {
    const response = await api.call('user/login/', 'POST', { json: req.body });
    if (response.status !== 200) return res.status(response.status).end();
    else {
        jwt.sign(response.body, 'Secret', { expiresIn: '30m' }, (err, token) => {
            if (err) return res.sendStatus(500).end();
            res.cookie('token', token, { httpOnly: true });
            res.cookie('userData', { username: req.body.username });
            res.status(200).end();
        });
    }
});

// Change username and/or password
user.put('/', withAuth, async (req, res) => {
    const response = await api.call('user/', 'PUT', {
        json: {
            ID: req.user.ID,
            newUsername: req.body.newUsername,
            currentPassword: req.body.currPassword,
            newPass: req.body.newPassword
        }
    });
    if (response.status !== 200) return res.status(response.status).end();
    else {
        jwt.sign(response.body, 'Secret', { expiresIn: '30m' }, (err, token) => {
            if (err) return res.sendStatus(500).end();
            res.cookie('token', token, { httpOnly: true });
            res.cookie('userData', { username: req.body.newUsername });
            res.status(200).end();
        });
    }
});

// Delete account, delete firebase too
user.delete('/', withAuth, async (req, res) => {
    // Delete from MongoDB
    const response = await api.call('user/', 'DELETE', {
        json: { username: req.user.username }
    });
    if (response.status !== 200) res.status(response.status).end();
    else {
        // Delete from Firebase
        // response = await firebaseAPI.call('users/' + req.user.ID, 'DELETE', {});
        // const payload = {};
        // const token = jwt.sign(payload, 'Secret', { expiresIn: '1' });
        jwt.sign(response.body, 'Secret', { expiresIn: '30m' }, (err, token) => {
            if (err) return res.sendStatus(500).end();
            res.cookie('token', token, { httpOnly: true });
            res.cookie('userData', { username: req.body.newUsername });
            res.status(200).end();
        });
    }
});

// Invalidate Token (Sign Out)
user.get('/invalidate', withAuth, async (req, res) => {
    const payload = {};
    const token = jwt.sign(payload, 'Secret', { expiresIn: '1' });
    res.cookie('token', token, { httpOnly: true });
    res.status(200).end();
});

// Validate Token (Middleware does all the work)
user.get('/validate', withAuth, async (req, res) => {
    res.status(200).end();
});

module.exports = user;
