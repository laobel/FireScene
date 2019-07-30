/*global Cesium*/
define([
],function(
){
    'use strict';

    var freezeObject= Cesium.freezeObject;

    /**
     *定义绘制模式。
     *
     * @exports DrawMode
     *
     *@see DrawMode
     *
     */
    var DrawMode={
        /**
         * 绘制点。
         *
         * @type {Number}
         * @constant
         */
        DRAWPOINT:0,
        /**
         * 绘制线。
         *
         * @type {Number}
         * @constant
         */
        DRAWLINE:1,
        /**
         * 绘制面。
         *
         * @type {Number}
         * @constant
         */
        DRAWAREA:2
    };

    return freezeObject(DrawMode);
});
