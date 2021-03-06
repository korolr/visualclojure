const vscode = require('vscode');
const helpers = require('./helpers');
const nreplClient = require('../nrepl/client');
const nreplMsg = require('../nrepl/message');
const SESSION_TYPE = require('../nrepl/session_type');
const clojureEvaluation = require('./evaluation');

function findSession(state, current, sessions) {
    let tmpClient = nreplClient.create({
            host: state.hostname,
            port: state.port
        })
        .once('connect', function () {
            let msg = nreplMsg.testSession(sessions[current]);
            tmpClient.send(msg, function (results) {
                for (var i = 0; i < results.length; i++) {
                    let result = results[i];
                    if (result.value && result.value === "3.14") {
                        state.session_type = SESSION_TYPE.CLJS;
                        state.session.cljs = sessions[current];
                    } else if (result.ex) {
                        state.session.clj = sessions[current];
                        state.session.cljc = sessions[current];
                    }
                }
                tmpClient.end();
            });
        })
        .once('end', function () {
            //If last session, check if found
            if (current === (sessions.length - 1) && !state.session.hasOwnProperty('cljs')) {
                //Default to first session if no cljs-session is found, and treat it as a clj-session
                if (sessions.length > 0) {
                    state.session.clj = sessions[current];
                    state.session.cljc = sessions[current];
                    state.session_type = SESSION_TYPE.CLJ;
                }
            } else if (Object.keys(state.session).length !== 3){
                findSession(state, (current + 1), sessions);
            } else {
                //Check the initial file where the command is called from
                clojureEvaluation.evaluateFile(state);
            }
            helpers.updateStatusbar(state);
        });
};

function initialConnection(state) {
    vscode.window.showInputBox({
        placeHolder: "Enter existing nREPL hostname:port here...",
        prompt: "Add port to nREPL if localhost, otherwise 'hostname:port'",
        value: "localhost:",
        ignoreFocusOut: true
    })
        .then(function (url) {
            let [hostname, port] = url.split(':');
            state.hostname = hostname;
            state.port = port;
            let lsSessionClient = nreplClient.create({
                host: state.hostname,
                port: state.port
            }).once('connect', function () {
                state.connected = true;
                let msg = nreplMsg.listSessions();
                lsSessionClient.send(msg, function (results) {
                    findSession(state, 0, results[0].sessions);
                    lsSessionClient.end();
                });
            });
        });
};

module.exports = {
    initialConnection
};
