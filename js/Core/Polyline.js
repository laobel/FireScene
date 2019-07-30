/*global Cesium*/
define([
    './copyOptions',
    './uid',
    './createDescribe'
], function (
    copyOptions,
    uid,
    createDescribe
) {
    'use strict';

    //默认标注线的配置
    var polylineDefaultOptions = {
        id: undefined,
        name: undefined,
        positions: undefined,
        enableEdit: true,
        nodes: [{
            show: false,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            scale: 1.2,
            image: Cesium.buildModuleUrl('../../img/DrawHelper/node.png'),
            pixelOffset: new Cesium.Cartesian2(0, 0),
            eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0),
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
        },
            {
                show: false,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                scale: 1.2,
                image: Cesium.buildModuleUrl('../../img/DrawHelper/mid_node.png'),
                pixelOffset: new Cesium.Cartesian2(0, 0),
                eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0),
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
            },
            {
                show: false,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                scale: 1.2,
                image: Cesium.buildModuleUrl('../../img/DrawHelper/node_light.png'),
                pixelOffset: new Cesium.Cartesian2(0, 0),
                eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0),
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
            },
            {
                show: false,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                scale: 1.2,
                image: Cesium.buildModuleUrl('../../img/DrawHelper/mid_node_light.png'),
                pixelOffset: new Cesium.Cartesian2(0, 0),
                eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0),
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
            }],
        line: {
            show: true,
            width: 5,
            granularity: 10000,
            material : new Cesium.PolylineGlowMaterialProperty({
                color : Cesium.Color.fromBytes(255, 255, 0, 255),
                glowPower : 0.25
            }),
            depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.RED,
                outlineWidth: 0,
                outlineColor: Cesium.Color.RED
            }),
            //heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            clampToGround : true,
            followSurface: false
        },
        attributes:undefined
    };

    /**
     * 自定义线要素
     * @param viewer
     * @constructor
     */
    function Polyline(viewer, positions, options) {
        if (!Cesium.defined(viewer)) {
            throw new Cesium.DeveloperError('viewer is required!');
        }
        if (!Cesium.defined(positions)) {
            throw new Cesium.DeveloperError("positions is requied!");
        }
        if (positions.length < 2) {
            throw new Cesium.DeveloperError("positions 的长度不合法!");
        }

        options = Cesium.defined(options) ? options : {};

        this._options = copyOptions(options, polylineDefaultOptions);
        this._positions = positions;
        this._id=Cesium.defined(options.id)?options.id:uid('polyline');
        this._viewer = viewer;

        this._ellipsoid = this._viewer.scene.globe.ellipsoid;

        this._isUsingTerrain=!!(typeof options.isUsingTerrain!=="undefined"?options.isUsingTerrain:true);

        this._nodeOptions = undefined;
        this._lineOptions = undefined;

        this._path=[];
        this._nodePos=[0];

        this.nodes = [];
        this.line = undefined;

        this.name = Cesium.defined(this._options.name) ? this._options.name :"";
        this.description = this._options.attributes;

        this.init(this._options);
    }

    Cesium.defineProperties(Polyline.prototype, {
        viewer: {
            get: function () {
                return this._viewer;
            }
        },
        id:{
            get:function () {
                return this._id;
            }
        },
        isUsingTerrain:{
            get:function () {
                return this._isUsingTerrain;
            },
            set:function (value) {
                this._isUsingTerrain=value;
            }
        }
    });

    Polyline.prototype._initNode=function(){
        if (!Cesium.defined(this._options.nodes)) {
            return;
        }

        for (var i = 0; i < this._nodePos.length; i++) {
            if (i % 2 === 0) {
                this._nodeOptions = {
                    id : this._id + "_node=" + i,
                    position : this._path[this._nodePos[i]],
                    billboard : this._options.nodes[0]
                };
            } else {
                this._nodeOptions = {
                    id : this.id + "_node=" + i,
                    position : this._path[this._nodePos[i]],
                    billboard : this._options.nodes[1]
                };
            }
            if (Cesium.defined(this._options.attributes)) {
                this._nodeOptions.description = createDescribe(this._options.attributes);
            }

            if (Cesium.defined(this._nodeOptions)) {
                this.nodes.push(this._viewer.entities.add(this._nodeOptions));
            }
        }
    };

    Polyline.prototype._initLine=function(){
        if (!Cesium.defined(this._options.line)) {
            return;
        }
        this._lineOptions = {
            id : this.id + "_line",
            polyline : this._options.line
        };

        var that = this;
        var positionCBP = function() {
            return that._path;
        };
        this._lineOptions.polyline.positions = new Cesium.CallbackProperty(positionCBP, false);

        this.line = this._viewer.entities.add(this._lineOptions);
    };

    Polyline.prototype.init=function () {
        var that=this;
        if(this._isUsingTerrain){
            var terrainSamplePositions = [];
            for (var i = 1; i < this._positions.length; ++i) {
                var flatPositions = Cesium.PolylinePipeline.generateArc({
                    positions : [that._positions[i - 1], that._positions[i]],
                    granularity : 0.000001
                });

                var j = 0;
                if (i === 1) {
                    for (j = 0; j < flatPositions.length; j += 3) {
                        terrainSamplePositions.push(that._ellipsoid.cartesianToCartographic(Cesium.Cartesian3.unpack(flatPositions, j)));
                    }
                } else {
                    for (j = 3; j < flatPositions.length; j += 3) {
                        terrainSamplePositions.push(that._ellipsoid.cartesianToCartographic(Cesium.Cartesian3.unpack(flatPositions, j)));
                    }
                }
                that._nodePos.push(that._nodePos[that._nodePos.length - 1] + parseInt((terrainSamplePositions.length - 1 - that._nodePos[that._nodePos.length - 1]) / 2));
                that._nodePos.push(terrainSamplePositions.length - 1);
            }

            Cesium.when(Cesium.sampleTerrainMostDetailed(that._viewer.terrainProvider, terrainSamplePositions), function(samples) {
                that._path = that._ellipsoid.cartographicArrayToCartesianArray(samples);

                that._initLine();
                that._initNode();
            });
        }else {
            that._path=[];
            for (var i = 0; i < that._positions.length; ++i) {
                if(i>0){
                    var distances = {
                        x : that._positions[i].x - that._positions[i-1].x,
                        y : that._positions[i].y - that._positions[i-1].y,
                        z : that._positions[i].z - that._positions[i-1].z
                    };
                    that._path.push(new Cesium.Cartesian3(that._positions[i].x-distances.x/2,that._positions[i].y-distances.y/2,that._positions[i].z-distances.z/2));
                }

                that._path.push(that._positions[i]);
            }
            that._nodePos=[];
            for (var i = 0; i < that._path.length; i++) {
                that._nodePos[i]=i;
            }

            that._initLine();
            that._initNode();
        }
    };

    Polyline.prototype.refresh=function() {
        var that=this;
        var ellipsoid = this._viewer.scene.globe.ellipsoid;

        if(this._isUsingTerrain){
            Cesium.when(Cesium.sampleTerrainMostDetailed(that._viewer.terrainProvider, ellipsoid.cartesianArrayToCartographicArray(that._positions)), function(positions) {
                that._positions = ellipsoid.cartographicArrayToCartesianArray(positions);

                var terrainSamplePositions = [],flatPositions;
                that._nodePos = [0];
                for (var i = 1; i < that._positions.length; ++i) {
                    flatPositions = Cesium.PolylinePipeline.generateArc({
                        positions : [that._positions[i - 1], that._positions[i]],
                        granularity : 0.000001
                    });

                    var j = 0;
                    if (i === 1) {
                        for (j = 0; j < flatPositions.length; j += 3) {
                            terrainSamplePositions.push(ellipsoid.cartesianToCartographic(Cesium.Cartesian3.unpack(flatPositions, j)));
                        }
                    } else {
                        for (j = 3; j < flatPositions.length; j += 3) {
                            terrainSamplePositions.push(ellipsoid.cartesianToCartographic(Cesium.Cartesian3.unpack(flatPositions, j)));
                        }
                    }
                    that._nodePos.push(that._nodePos[that._nodePos.length - 1] + parseInt((terrainSamplePositions.length - 1 - that._nodePos[that._nodePos.length - 1]) / 2));
                    that._nodePos.push(terrainSamplePositions.length - 1);
                }

                Cesium.when(Cesium.sampleTerrainMostDetailed(that._viewer.terrainProvider, terrainSamplePositions), function(samples) {
                    that._path = ellipsoid.cartographicArrayToCartesianArray(samples);

                    for (var i = 0; i < that._nodePos.length; i++) {
                        that.nodes[i].position = that._path[that._nodePos[i]];
                    }
                });
            });
        }else {
            that._path =[];
            for (var i = 0; i < that._positions.length; i++) {
                var cartographic = ellipsoid.cartesianToCartographic(that._positions[i]);
                var longitude= Cesium.Math.toDegrees(cartographic.longitude);
                var latitude = Cesium.Math.toDegrees(cartographic.latitude);
                that._positions[i] = new Cesium.Cartesian3.fromDegrees(longitude,latitude);

                if(i>0){
                    var distances = {
                        x : that._positions[i].x - that._positions[i-1].x,
                        y : that._positions[i].y - that._positions[i-1].y,
                        z : that._positions[i].z - that._positions[i-1].z
                    };
                    that._path.push(new Cesium.Cartesian3(that._positions[i].x-distances.x/2,that._positions[i].y-distances.y/2,that._positions[i].z-distances.z/2));
                }

                that._path.push(that._positions[i]);
            }

            for (var i = 0; i < that._nodePos.length; i++) {
                that._nodePos[i]=i;
                that.nodes[i].position = that._path[i];
            }
        }
    };


    return Polyline;
});