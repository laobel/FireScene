/*global Cesium*/
define([

],function () {
    'use strict';

    function createDescribe(attributes) {
        var html = '';
        for (var key in attributes) {
            var value = attributes[key];
            if (Cesium.defined(value)) {
                if (typeof value === 'object') {
                    html += '<tr><th>' + key + '</th><td>' + createDescribe(value) + '</td></tr>';
                } else {
                    html += '<tr><th>' + key + '</th><td>' + value + '</td></tr>';
                }
            }
        }

        if (html.length > 0) {
            html = '<table class="cesium-infoBox-defaultTable"><tbody>' + html + '</tbody></table>';
        }

        return html;
    }

    return createDescribe;
});



