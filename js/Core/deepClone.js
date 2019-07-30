/*global Cesium*/
define([

],function () {
    'use strict';

    function getType(obj){
        //tostring会返回对应不同的标签的构造函数
        var toString = Object.prototype.toString;
        var map = {
            '[object Boolean]'  : 'boolean',
            '[object Number]'   : 'number',
            '[object String]'   : 'string',
            '[object Function]' : 'function',
            '[object Array]'    : 'array',
            '[object Date]'     : 'date',
            '[object RegExp]'   : 'regExp',
            '[object Undefined]': 'undefined',
            '[object Null]'     : 'null',
            '[object Object]'   : 'object'
        };
        if(obj instanceof Element) {
            return 'element';
        }
        return map[toString.call(obj)];
    }

    function deepClone(data,options) {
        var ignores=[];
        var filters=[];
        if(Cesium.defined(options)){
            ignores=typeof options.ignores!=='undefined'?options.ignores:[];
            filters=typeof options.filters!=='undefined'?options.filters:[];
        }

        var type = getType(data);
        var obj;
        if(type === 'array'){
            obj = [];
        } else if(type === 'object'){
            obj = {};
        } else {
            //不再具有下一层次
            return data;
        }
        if(type === 'array'){
            for(var i = 0, len = data.length; i < len; i++){
                if(ignores.length>0 && ignores.contains(data[i])){
                    continue;
                }
                if(filters.length>0){
                    if(filters.contains(data[i])){
                        obj.push(deepClone(data[i]));
                    }else {
                        continue;
                    }
                }else {
                    obj.push(deepClone(data[i]));
                }
            }
        } else if(type === 'object'){
            for(var key in data){
                if(ignores.length>0 && ignores.contains(key)){
                    continue;
                }
                if(filters.length>0){
                    if(filters.contains(key)){
                        obj[key] = deepClone(data[key]);
                    }else {
                        continue;
                    }
                }else {
                    obj[key] = deepClone(data[key]);
                }
            }
        }
        return obj;
    }

    return deepClone;
});
