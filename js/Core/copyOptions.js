/*global Cesium*/
define([

],function () {
    'use strict';

    function copyOptions(options, defaultOptions) {
        var newOptions = {}, option;
        for (option in defaultOptions) {
            if (typeof defaultOptions[option] === "object") {
                if (defaultOptions[option] instanceof Array) {
                    newOptions[option] = defaultOptions[option];
                } else {
                    if (newOptions[option] === undefined) {
                        newOptions[option] = {};
                    }
                    newOptions[option] = copyOptions(defaultOptions[option], newOptions[option]);
                }
            } else {
                newOptions[option] = defaultOptions[option];
            }
        }

        for (option in options) {
            if (typeof options[option] === "object") {
                if (options[option] instanceof Array) {
                    newOptions[option] = options[option];
                } else {
                    if (newOptions[option] === undefined) {
                        newOptions[option] = {};
                    }
                    newOptions[option] = copyOptions(options[option], newOptions[option]);
                }
            } else {
                newOptions[option] = options[option];
            }
        }
        return newOptions;
    }

    return copyOptions;
});



