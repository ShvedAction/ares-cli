#!/usr/bin/env node

/*
 * Copyright (c) 2020 LG Electronics Inc.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path'),
    async = require('async'),
    log = require('npmlog'),
    nopt = require('nopt'),
    shellLib = require('./../lib/shell'),
    commonTools = require('./../lib/base/common-tools');

const version = commonTools.version,
    cliControl = commonTools.cliControl,
    help = commonTools.help,
    setupDevice = commonTools.setupDevice,
    appdata = commonTools.appdata;

const processName = path.basename(process.argv[1]).replace(/.js/, '');

process.on('uncaughtException', function(err) {
    log.error('uncaughtException', err.toString());
    log.verbose('uncaughtException', err.stack);
    cliControl.end(-1);
});

const knownOpts = {
    "device":   [String, null],
    "device-list":  Boolean,
    "display" : [String, null],
    "version":  Boolean,
    "run": [String, null],
    "help":     Boolean,
    "level":    ['silly', 'verbose', 'info', 'http', 'warn', 'error']
};

const shortHands = {
    "d": ["--device"],
    "D": ["--device-list"],
    "dp": ["--display"],
    "V": ["--version"],
    "r": ["--run"],
    "h": ["--help"],
    "v": ["--level", "verbose"]
};
const argv = nopt(knownOpts, shortHands, process.argv, 2 /* drop 'node' & 'ares-shell.js'*/);

log.heading = processName;
log.level = argv.level || 'warn';
log.verbose("argv", argv);

const options = {
        name: argv.device,
        display : argv.display
    };

let op;
if (argv['device-list']) {
    setupDevice.showDeviceListAndExit();
} else if (argv.version) {
    version.showVersionAndExit();
} else if (argv.run) {
    op = run;
} else if (argv.help) {
    showUsage();
    cliControl.end();
} else {
    op = shell;
}

if (op) {
    version.checkNodeVersion(function() {
        async.series([
            op.bind(this)
        ],finish);
    });
}

function showUsage() {
    help.display(processName, appdata.getConfig(true).profile);
}

function run() {
    if(argv.display !== undefined && isNaN(Number(argv.display))) {
        return finish("Please use nonnegative integer values for a \"display\" option");
    }
    shellLib.remoteRun(options, argv.run, finish);
}

function shell() {
    if(argv.display !== undefined && isNaN(Number(argv.display))) {
        return finish("Please use nonnegative integer values for a \"display\" option");
    }
    shellLib.shell(options, finish);
}

function finish(err, value) {
    if (err) {
        log.error(err.toString());
        log.verbose(err.stack);
        cliControl.end(-1);
    } else {
        if (value && value.msg) {
            console.log(value.msg);
        }
        cliControl.end();
    }
}