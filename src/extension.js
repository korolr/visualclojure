const state = require('./state'); //initial state
const vscode = require('vscode');
const helpers = require('./clojure/helpers');
const clojureConnect = require('./clojure/connect');
const clojureEvaluation = require('./clojure/evaluation');
const CompletionItemProvider = require('./providers/completion');
const TextDocumentContentProvider = require('./providers/content');
const HoverProvider = require('./providers/hover');
const DefinitionProvider = require('./providers/definition');
const ClojureLanguageConfiguration = require('./clojure/language');

function activate(context) {
    vscode.languages.setLanguageConfiguration(state.CLOJURE_MODE.language, new ClojureLanguageConfiguration());
    helpers.updateStatusbar(state);

    //COMMANDS
    context.subscriptions.push(vscode.commands.registerCommand('visualclojure.connect', clojureConnect.initialConnection.bind(null, state)));
    context.subscriptions.push(vscode.commands.registerCommand('visualclojure.evaluateExpression', clojureEvaluation.evaluateExpression.bind(null, state)));
    context.subscriptions.push(vscode.commands.registerCommand('visualclojure.evaluateFile', clojureEvaluation.evaluateFile.bind(null, state)));
    context.subscriptions.push(vscode.commands.registerCommand('visualclojure.toggleSession', clojureConnect.toggleSession.bind(null, state)));

    //EVENTS
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((document) => {
        clojureEvaluation.evaluateFile(state, document);
    }));
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((document) => {
        clojureEvaluation.evaluateFile(state, document);
    }));

    //PROVIDERS
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(state.CLOJURE_MODE, new CompletionItemProvider(state)));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(state.CLOJURE_MODE, new DefinitionProvider(state)));
    context.subscriptions.push(vscode.languages.registerHoverProvider(state.CLOJURE_MODE, new HoverProvider(state)));
    vscode.workspace.registerTextDocumentContentProvider('jar', new TextDocumentContentProvider(state));
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
