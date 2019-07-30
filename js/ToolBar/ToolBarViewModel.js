/*global Cesium*/
define([
    '../Core/DrawMode',
],function (
    DrawMode
) {
    'use strict';

    function ToolBarViewModel(viewer) {
        if (!Cesium.defined(viewer)) {
            throw new Cesium.DeveloperError('viewer is required!');
        }

        this._viewer=viewer;

        this._activeElement='guide';

        var that = this;
        this._homeCommand = Cesium.createCommand(function() {

            that.viewer.home(that._viewer,true,1.0);
        });
        this._drawLineCommand= Cesium.createCommand(function() {
            that.viewer.drawHelper.drawMode=DrawMode.DRAWLINE;
            that.viewer.drawHelper.drawing=true;
        });
        this._addLineCommand= Cesium.createCommand(function() {
            that.viewer.drawHelper.drawMode=DrawMode.DRAWLINE;
            that.viewer.drawHelper.drawing=false;

            var options={
                line: {
                    show: true,
                    width: 5,
                    granularity: 10000,
                    material: Cesium.Material.fromType(Cesium.Material.PolylineGlowType, {
                        glowPower:0.2,
                        /*color: new Cesium.Color.fromBytes(190, 240, 85, 255)*/
                        color: new Cesium.Color.fromBytes(190, 240, 85, 255)
                    }),
                    depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.RED,
                        outlineWidth: 0,
                        outlineColor: Cesium.Color.RED
                    }),
                    followSurface: false
                },
                name:'测试添加线',
                attributes:{
                    "姓名":"张三",
                    "电话":"13565657894",
                    "备注":"假的"
                }
            };
            that.viewer.drawHelper.addPolyline(Cesium.Cartesian3.fromDegreesArray([102.267,24.9,102.636,24.91,102.657,24.915,102.653,24.936]),options);
        });

        this._openTerrainCommand=Cesium.createCommand(function() {
            viewer.terrainProvider=new Cesium.CesiumTerrainProvider({
                //url : 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
                url : '//assets.agi.com/stk-terrain/world',
                requestWaterMask : true,
                credit:"",
                requestVertexNormals : true
                //proxy : new Cesium.DefaultProxy('/terrain/')

            });

            for(var i=0;i<viewer.drawHelper.polylines.length;i++){
                viewer.drawHelper.polylines[i].isUsingTerrain=true;
                viewer.drawHelper.polylines[i].refresh();
            }
        });

        this._closeTerrainCommand=Cesium.createCommand(function() {
            viewer.terrainProvider=new Cesium.EllipsoidTerrainProvider();

            for(var i=0;i<viewer.drawHelper.polylines.length;i++){
                viewer.drawHelper.polylines[i].isUsingTerrain=false;
                viewer.drawHelper.polylines[i].refresh();
            }
        });

        this._startEditCommand= Cesium.createCommand(function() {
            that.viewer.drawHelper.startEdit();
        });
        this._stopEditCommand= Cesium.createCommand(function() {
            that.viewer.drawHelper.stopEdit();
        });

        this._screenCaptureCommand= Cesium.createCommand(function() {

        });

        Cesium.knockout.track(this, ['activeElement']);
        Cesium.knockout.defineProperty(this, 'activeElement', {
            get : function() {
                return this._activeElement;
            },
            set:function (value) {
                this._activeElement=value;
            }
        });

        this._activeCommand= Cesium.createCommand(function(data,event) {
            var element=event.target;
            if(event.target.tagName!=='DIV'){
                element=event.target.parentNode;
            }
            var className=element.querySelectorAll('i')[0].className;
            className=className.replace('active','');
            that.activeElement=className.replace(/\s+/g,'');
        });
    }

    Cesium.defineProperties(ToolBarViewModel.prototype, {
        viewer: {
            get: function () {
                return this._viewer;
            }
        },
        activeCommand:{
            get:function () {
                return this._activeCommand;
            }
        },
        homeCommand:{
            get:function () {
                return this._homeCommand;
            }
        },
        drawLineCommand:{
            get:function () {
                return this._drawLineCommand;
            }
        },
        addLineCommand:{
            get:function () {
                return this._addLineCommand;
            }
        },
        openTerrainCommand:{
            get:function () {
                return this._openTerrainCommand;
            }
        },
        closeTerrainCommand:{
            get:function () {
                return this._closeTerrainCommand;
            }
        },
        startEditCommand:{
            get:function () {
                return this._startEditCommand;
            }
        },
        stopEditCommand:{
            get:function () {
                return this._stopEditCommand;
            }
        },
        screenCaptureCommand:{
            get:function () {
                return this._screenCaptureCommand;
            }
        },

    });

    return ToolBarViewModel;
});