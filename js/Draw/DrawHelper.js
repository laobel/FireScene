/*global Cesium*/
define([
    '../Core/Polyline',
    '../Core/DrawMode',
    '../Core/copyOptions',
    '../Core/createDescribe'
], function (
    Polyline,
    DrawMode,
    copyOptions,
    createDescribe
) {
    'use strict';


    function DrawHelper(viewer) {
        if (!Cesium.defined(viewer)) {
            throw new Cesium.DeveloperError('viewer is required!');
        }

        this._viewer = viewer;

        this._enableEdit=false;
        this._enableInfo=true;

        this._drawing = false;
        this._editing = false;
        this._highLighting=false;
        this._editingObj = undefined;
        this._pickObj=undefined;
        this._highLightObj = undefined;

        this._moving=false;

        this._drawMode = DrawMode.DRAWPOINT;

        this._ellipsoid = viewer.scene.globe.ellipsoid;

        this.Polyline = Polyline;

        this._polylines = [];
    }

    Cesium.defineProperties(DrawHelper.prototype, {
        viewer: {
            get: function () {
                return this._viewer;
            }
        },
        enableEdit:{
            get:function () {
                return this._enableEdit;
            },
            set:function (value) {
                this._enableEdit=!!value;
            }
        },
        enableInfo:{
            get:function () {
                return this._enableInfo;
            },
            set:function (value) {
                this._enableInfo=!!value;
            }
        },
        drawing: {
            get: function () {
                return this._drawing;
            },
            set: function (value) {
                this._drawing = !!value;
            }
        },
        editing: {
            get: function () {
                return this._editing;
            },
            set: function (value) {
                this._editing = !!value;
                this.drawing = !this.editing;
            }
        },
        moving: {
            get: function () {
                return this._moving;
            },
            set: function (value) {
                this._moving = !!value;
            }
        },
        highLighting: {
            get: function () {
                return this._highLighting;
            },
            set: function (value) {
                this._highLighting = value;
            }
        },
        pickObj:{
            get:function () {
                return this._pickObj;
            },
            set:function (value) {
                this._pickObj=value;
            }
        },
        editingObj: {
            get: function () {
                return this._editingObj;
            },
            set: function (value) {
                this._editingObj = value;
            }
        },
        highLightObj: {
            get: function () {
                return this._highLightObj;
            },
            set:function (value) {
                this._highLightObj=value;
            }
        },
        drawMode: {
            get: function () {
                return this._drawMode;
            },
            set: function (value) {
                this._drawMode = value;
            }
        },
        polylines: {
            get: function () {
                return this._polylines;
            }
        }
    });

    //取消激活编辑
    DrawHelper.prototype.disableEdit = function() {
        this._editing = false;
        this.disableNodeHightLight();
        this._pickObj = undefined;
        this._viewer.container.style.cursor = "default";
        if (!Cesium.defined(this._editingObj)) {
            return;
        }

        if(this._editingObj.id.split('.')[1] === 'polyline') {
            this.disableHighLight();
            for (var i = 0; i < this._editingObj.nodes.length; i++) {
                this._editingObj.nodes[i].billboard.show = false;
            }
        }
    };

    //激活编辑
    DrawHelper.prototype.setEdit = function() {
        this._editing = true;
        if (!Cesium.defined(this._editingObj)) {
            this.disableEdit();
            return;
        }

        if(this._editingObj.id.split('.')[1] === 'polyline') {
            this.setHighLight();

            for (var i = 0; i < this._editingObj.nodes.length; i++) {
                this._editingObj.nodes[i].billboard.show = true;
            }
        }
    };

    DrawHelper.prototype.disableHighLight = function() {
        this.viewer.container.style.cursor = "default";
        if (!Cesium.defined(this._highLightObj)) {
            return;
        }

        if (this._highLighting) {
            if (this._highLightObj.id.split('.')[1] === 'polyline') {
                this._highLightObj.line.polyline.material = this._oldPolylineMaterial;
                this._highLightObj.line.polyline.width = this._oldPolylineWidth;
            }
            this._highLighting = false;
        }
        this._highLightObj=undefined;
    };

    DrawHelper.prototype.setHighLight = function() {
        if (!Cesium.defined(this._highLightObj)) {
            this.disableHighLight();
            return;
        }

        this._viewer.container.style.cursor = "pointer";

        if (!this._highLighting) {
            if (this._highLightObj.id.split('.')[1] === 'polyline') {
                this._oldPolylineMaterial = this._highLightObj.line.polyline.material;
                this._highLightObj.line.polyline.material = new Cesium.PolylineOutlineMaterialProperty({
                    color : Cesium.Color.RED.withAlpha(0.6),
                    outlineWidth : 2,
                    outlineColor : Cesium.Color.RED
                });

                this._oldPolylineWidth = this._highLightObj.line.polyline.width;
                this._highLightObj.line.polyline.width = this._highLightObj.line.polyline.width * 1.5;
            }

            this._highLighting = true;
        }

    };

    DrawHelper.prototype.setNodeHightLight = function() {
        if (!Cesium.defined(this._pickObj)) {
            return;
        }
        var pos = parseInt(this._pickObj._id.split('=')[1]);
        if (pos % 2 === 0) {
            this._pickObj.billboard.image = this._editingObj._options.nodes[2].image;
        } else {
            this._pickObj.billboard.image = this._editingObj._options.nodes[3].image;
        }
    };

    DrawHelper.prototype.disableNodeHightLight = function() {
        if (!Cesium.defined(this._pickObj) || !Cesium.defined(this._pickObj.billboard) || !Cesium.defined(this._editingObj)) {
            return;
        }
        var pos = parseInt(this._pickObj._id.split('=')[1]);
        if (pos % 2 === 0) {
            this._pickObj.billboard.image = this._editingObj._options.nodes[0].image;
        } else {
            this._pickObj.billboard.image = this._editingObj._options.nodes[1].image;
        }
    };

    DrawHelper.prototype._enableRotation = function(enable) {
        this._viewer.scene.screenSpaceCameraController.enableRotate = enable;
        this._viewer.scene.screenSpaceCameraController.enableTranslate = enable;
    };

    DrawHelper.prototype.showInfoBox = function(position) {
        if (!this._enableInfo) {
            return;
        }
        if (!Cesium.defined(this._editingObj)) {
            return;
        }

        var description = "";
        var title = "";
       if (this._editingObj.id.split('.')[1].substr(0, 8) === 'polyline') {
            position = Cesium.defined(position)?position:this._editingObj._path[parseInt(this._editingObj._path.length / 2)];
            description = createDescribe(this._editingObj.description);
            title = this._editingObj.name;

            this._viewer.popupWindow.ay = 0;
        }

        this._viewer.popupWindow.showAt(position, title, description);
    };

    DrawHelper.prototype.startMoving = function() {
        this._enableRotation(false);
        this._viewer.container.style.cursor = "move";
        this._moving = true;
    };

    DrawHelper.prototype.endMoving = function() {
        var that=this;
        var endMoveDo=function() {
            var pos = 0;
            var options = {};
            if (Cesium.defined(that._pickObj) && that._pickObj._id.split('.')[1].substr(0, 13) === 'polyline_node') {
                pos = parseInt(that._pickObj._id.split('=')[1]);
                if (pos > 0 && pos < that._editingObj._nodePos.length - 1) {
                    if (pos % 2 === 0) {

                    } else {
                        var position=new Cesium.Cartesian3(that._editingObj._path[that._editingObj._nodePos[pos]].x,that._editingObj._path[that._editingObj._nodePos[pos]].y,that._editingObj._path[that._editingObj._nodePos[pos]].z);
                        that._editingObj.nodes[pos].billboard.image = that._editingObj._options.nodes[0].image;
                        that._editingObj._positions.splice((pos + 1) / 2, 0, position);
                        if(that._editingObj.isUsingTerrain){
                            that._editingObj._nodePos.splice(pos + 1, 0, that._editingObj._nodePos[pos] + parseInt((that._editingObj._nodePos[pos + 1] - that._editingObj._nodePos[pos]) / 2));
                            that._editingObj._nodePos.splice(pos, 0, that._editingObj._nodePos[pos - 1] + parseInt((that._editingObj._nodePos[pos] - that._editingObj._nodePos[pos - 1]) / 2));
                        }else {
                            var distances1 = {
                                x : position.x - that._editingObj._positions[(pos-1) / 2].x,
                                y : position.y - that._editingObj._positions[(pos-1) / 2].y,
                                z : position.z - that._editingObj._positions[(pos-1) / 2].z
                            };
                            var distances2 = {
                                x : that._editingObj._positions[(pos+1) / 2+1].x - position.x,
                                y : that._editingObj._positions[(pos+1) / 2+1].y - position.y,
                                z : that._editingObj._positions[(pos+1) / 2+1].z - position.z
                            };

                            that._editingObj._path.splice(pos + 1, 0, new Cesium.Cartesian3(position.x+distances2.x/2,position.y+distances2.y/2,position.z+distances2.z/2));
                            that._editingObj._path.splice(pos, 0, new Cesium.Cartesian3(position.x-distances1.x/2,position.y-distances1.y/2,position.z-distances1.z/2));

                            that._editingObj._nodePos[that._editingObj._path.length-2]=that._editingObj._path.length-2;
                            that._editingObj._nodePos[that._editingObj._path.length-1]=that._editingObj._path.length-1;
                        }

                        for (var i = 0; i < that._editingObj.nodes.length; i++) {
                            that._viewer.entities.remove(that._editingObj.nodes[i]);
                        }
                        that._editingObj.nodes = [];

                        for (var i = 0; i < that._editingObj._nodePos.length; i++) {
                            if (i % 2 === 0) {
                                options = {
                                    id : that._editingObj.id + "_node=" + i,
                                    position : that._editingObj._path[that._editingObj._nodePos[i]],
                                    billboard : copyOptions({}, that._editingObj._options.nodes[0])
                                };
                            } else {
                                options = {
                                    id : that._editingObj.id + "_node=" + i,
                                    position : that._editingObj._path[that._editingObj._nodePos[i]],
                                    billboard : copyOptions({}, that._editingObj._options.nodes[1])
                                };
                            }
                            options.billboard.show = true;
                            if (Cesium.defined(options)) {
                                that._editingObj.nodes.push(that._viewer.entities.add(options));
                            }
                        }
                    }
                }
            }


            that._enableRotation(true);
            that._viewer.container.style.cursor = "default";
            that._moving = false;
            that.disableNodeHightLight();
            that._pickObj = undefined;
            that._isEditing=false;
        };
        endMoveDo();
    };

    DrawHelper.prototype.deleteFeature = function(feature) {
        var that = this;

        var deletePolyline = function() {
            for (var i = 0; i < feature.nodes.length; i++) {
                that._viewer.entities.remove(feature.nodes[i]);
            }

            that._viewer.entities.remove(feature.line);

            feature._positions=[];

            for (var i = 0; i < that.polylines.length; i++) {
                if (that.polylines[i].id === feature.id) {
                    that.polylines[i] = undefined;
                    that.polylines.splice(i, 1);
                    break;
                }
            }

            that._highLighting = undefined;
            that._editingObj = undefined;
            that._editing=false;

            feature = undefined;
        };

        if (feature) {
            if(feature.id.split('.')[1] === 'polyline') {
                deletePolyline();
            }
        }

        this._viewer.popupWindow.setVisible(false);
    };

    DrawHelper.prototype.editFeature = function(movement, position) {
        var that = this;
        that._isEditing=true;

        var editPolyline = function() {
            var cartographic = new Cesium.Cartographic.fromCartesian(position, that._ellipsoid);

            var terrainSamplePositions = [];
            var flatPositions;
            var temp;

            if (Cesium.defined(that._pickObj) && that._pickObj._id.split('.')[0] === that._editingObj.id.split('.')[0] && that._pickObj._id.split('.')[1].substr(0, 13) === 'polyline_node') {
                var pos = parseInt(that._pickObj._id.split('=')[1]);
                var path = that._editingObj._path;

                if(that._editingObj.isUsingTerrain){
                    if (pos === 0) {
                        path = that._editingObj._path.slice(that._editingObj._nodePos[pos + 2] + 1);

                        terrainSamplePositions = [];
                        flatPositions = Cesium.PolylinePipeline.generateArc({
                            positions : [that._ellipsoid.cartographicToCartesian(cartographic), that._editingObj._positions[1]],
                            granularity : 0.000001
                        });

                        for (var i = 0; i < flatPositions.length; i += 3) {
                            terrainSamplePositions.push(that._ellipsoid.cartesianToCartographic(Cesium.Cartesian3.unpack(flatPositions, i)));
                        }

                        Cesium.when(Cesium.sampleTerrainMostDetailed(that._viewer.terrainProvider, terrainSamplePositions), function(samples) {
                            that._editingObj._nodePos[0] = 0;
                            temp = that._editingObj._nodePos[2];
                            for (var j = 2; j < that._editingObj._nodePos.length; j++) {
                                if (j === 2) {
                                    that._editingObj._nodePos[1] = parseInt((samples.length - 1) / 2);
                                    that._editingObj._nodePos[j] = samples.length - 1;
                                } else {
                                    that._editingObj._nodePos[j] = that._editingObj._nodePos[j] + samples.length - 1 - temp;
                                }
                            }

                            that._editingObj._path = that._ellipsoid.cartographicArrayToCartesianArray(samples).concat(path);
                            that._editingObj._positions[0] = that._editingObj._path[0];
                            that._editingObj.nodes[pos].position = that._editingObj._path[that._editingObj._nodePos[pos]];
                            that._editingObj.nodes[pos + 1].position = that._editingObj._path[that._editingObj._nodePos[pos + 1]];
                        });

                    } else if (pos === that._editingObj._nodePos.length - 1) {
                        path = that._editingObj._path.slice(0, that._editingObj._nodePos[pos - 2]);

                        terrainSamplePositions = [];
                        flatPositions = Cesium.PolylinePipeline.generateArc({
                            positions : [that._editingObj._positions[that._editingObj._positions.length - 2], that._ellipsoid.cartographicToCartesian(cartographic)],
                            granularity : 0.000001
                        });

                        for (var i = 0; i < flatPositions.length; i += 3) {
                            terrainSamplePositions.push(that._ellipsoid.cartesianToCartographic(Cesium.Cartesian3.unpack(flatPositions, i)));
                        }

                        that._editingObj._nodePos[pos - 1] = that._editingObj._nodePos[pos - 2] + parseInt((terrainSamplePositions.length - 1) / 2);
                        that._editingObj._nodePos[pos] = that._editingObj._nodePos[pos - 2] + terrainSamplePositions.length - 1;

                        Cesium.when(Cesium.sampleTerrainMostDetailed(that._viewer.terrainProvider, terrainSamplePositions), function(samples) {
                            that._editingObj._path = path.concat(that._ellipsoid.cartographicArrayToCartesianArray(samples));
                            that._editingObj._positions[that._editingObj._positions.length - 1] = that._editingObj._path[that._editingObj._path.length - 1];
                            that._editingObj.nodes[pos].position = that._editingObj._path[that._editingObj._nodePos[pos]];
                            that._editingObj.nodes[pos - 1].position = that._editingObj._path[that._editingObj._nodePos[pos - 1]];
                            that._editingObj.nodes[pos - 2].position = that._editingObj._path[that._editingObj._nodePos[pos - 2]];
                        });
                    } else {
                        var path1, path2;
                        var flatPositions1, flatPositions2;
                        if (pos % 2 === 0) {
                            path1 = that._editingObj._path.slice(0, that._editingObj._nodePos[pos - 2]);
                            path2 = that._editingObj._path.slice(that._editingObj._nodePos[pos + 2] + 1);

                            terrainSamplePositions = [];
                            flatPositions1 = Cesium.PolylinePipeline.generateArc({
                                positions : [that._editingObj._positions[[pos - 2] / 2], that._ellipsoid.cartographicToCartesian(cartographic)],
                                granularity : 0.000001
                            });

                            for (var i = 0; i < flatPositions1.length - 3; i += 3) {
                                terrainSamplePositions.push(that._ellipsoid.cartesianToCartographic(Cesium.Cartesian3.unpack(flatPositions1, i)));
                            }

                            Cesium.when(Cesium.sampleTerrainMostDetailed(that._viewer.terrainProvider, terrainSamplePositions), function(samples1) {
                                flatPositions2 = Cesium.PolylinePipeline.generateArc({
                                    positions : [that._ellipsoid.cartographicToCartesian(samples1[samples1.length - 1]), that._editingObj._positions[[pos + 2] / 2]],
                                    granularity : 0.000001
                                });

                                var terrainSamplePositions1 = [];
                                for (var i = 3; i < flatPositions2.length; i += 3) {
                                    terrainSamplePositions1.push(that._ellipsoid.cartesianToCartographic(Cesium.Cartesian3.unpack(flatPositions2, i)));
                                }

                                Cesium.when(Cesium.sampleTerrainMostDetailed(that._viewer.terrainProvider, terrainSamplePositions1), function(samples2) {
                                    that._editingObj._nodePos[pos - 1] = that._editingObj._nodePos[pos - 2] + parseInt(samples1.length / 2) - 1;
                                    that._editingObj._nodePos[pos] = that._editingObj._nodePos[pos - 2] + samples1.length - 1;

                                    var samples = samples1.concat(samples2.slice(1));

                                    temp = that._editingObj._nodePos[pos + 2] - that._editingObj._nodePos[pos - 2];
                                    that._editingObj._nodePos[pos + 1] = that._editingObj._nodePos[pos] + parseInt(samples2.length / 2) - 1;
                                    that._editingObj._nodePos[pos + 2] = that._editingObj._nodePos[pos - 2] + samples.length - 1;
                                    for (var i = pos + 3; i < that._editingObj._nodePos.length; i++) {
                                        that._editingObj._nodePos[i] = that._editingObj._nodePos[i] + samples.length - 1 - temp;
                                    }

                                    that._editingObj._path = path1.concat(that._ellipsoid.cartographicArrayToCartesianArray(samples));
                                    that._editingObj._path = that._editingObj._path.concat(path2);

                                    that._editingObj._positions[pos / 2] = that._editingObj._path[that._editingObj._nodePos[pos]];
                                    that._editingObj.nodes[pos - 1].position = that._editingObj._path[that._editingObj._nodePos[pos - 1]];
                                    that._editingObj.nodes[pos].position = that._editingObj._path[that._editingObj._nodePos[pos]];
                                    that._editingObj.nodes[pos + 1].position = that._editingObj._path[that._editingObj._nodePos[pos + 1]];
                                });
                            });
                        } else {
                            path1 = that._editingObj._path.slice(0, that._editingObj._nodePos[pos-1]);
                            path2 = that._editingObj._path.slice(that._editingObj._nodePos[pos + 1] + 1);

                            terrainSamplePositions = [];
                            flatPositions1 = Cesium.PolylinePipeline.generateArc({
                                positions : [that._editingObj._positions[[pos - 1] / 2], that._ellipsoid.cartographicToCartesian(cartographic)],
                                granularity : 0.000001
                            });

                            for (var i = 0; i < flatPositions1.length - 3; i += 3) {
                                terrainSamplePositions.push(that._ellipsoid.cartesianToCartographic(Cesium.Cartesian3.unpack(flatPositions1, i)));
                            }

                            Cesium.when(Cesium.sampleTerrainMostDetailed(that._viewer.terrainProvider, terrainSamplePositions), function(samples1) {
                                flatPositions2 = Cesium.PolylinePipeline.generateArc({
                                    positions : [that._ellipsoid.cartographicToCartesian(samples1[samples1.length - 1]), that._editingObj._positions[[pos + 1] / 2]],
                                    granularity : 0.000001
                                });

                                var terrainSamplePositions1 = [];
                                for (var i = 3; i < flatPositions2.length; i += 3) {
                                    terrainSamplePositions1.push(that._ellipsoid.cartesianToCartographic(Cesium.Cartesian3.unpack(flatPositions2, i)));
                                }

                                Cesium.when(Cesium.sampleTerrainMostDetailed(that._viewer.terrainProvider, terrainSamplePositions1), function(samples2) {

                                    that._editingObj._nodePos[pos] = that._editingObj._nodePos[pos - 1] + samples1.length - 1;

                                    var samples = samples1.concat(samples2.slice(1));

                                    temp = that._editingObj._nodePos[pos + 1] - that._editingObj._nodePos[pos - 1];
                                    that._editingObj._nodePos[pos + 1] = that._editingObj._nodePos[pos - 1] + samples.length - 1;
                                    for (var i = pos + 2; i < that._editingObj._nodePos.length; i++) {
                                        that._editingObj._nodePos[i] = that._editingObj._nodePos[i] + samples.length - 1 - temp;
                                    }

                                    that._editingObj._path = path1.concat(that._ellipsoid.cartographicArrayToCartesianArray(samples));
                                    that._editingObj._path = that._editingObj._path.concat(path2);

                                    that._editingObj.nodes[pos].position = that._editingObj._path[that._editingObj._nodePos[pos]];
                                });
                            });
                        }

                    }
                }else {
                    if (pos === 0) {
                        var distances = {
                            x : that._editingObj._positions[1].x - position.x,
                            y : that._editingObj._positions[1].y - position.y,
                            z : that._editingObj._positions[1].z - position.z
                        };
                        that._editingObj._positions[0] = position;
                        that._editingObj._path[0]=position;
                        that._editingObj._path[1]=new Cesium.Cartesian3(position.x+distances.x/2,position.y+distances.y/2,position.z+distances.z/2);

                        that._editingObj.nodes[0].position = that._editingObj._path[that._editingObj._nodePos[0]];
                        that._editingObj.nodes[1].position = that._editingObj._path[that._editingObj._nodePos[1]];
                    } else if (pos === that._editingObj._nodePos.length - 1) {
                        that._editingObj._positions[that._editingObj._positions.length-1] = position;
                        var distances = {
                            x : position.x - that._editingObj._positions[that._editingObj._positions.length-2].x,
                            y : position.y - that._editingObj._positions[that._editingObj._positions.length-2].y,
                            z : position.z - that._editingObj._positions[that._editingObj._positions.length-2].z
                        };

                        that._editingObj._path[pos]=position;
                        that._editingObj._path[pos-1]=new Cesium.Cartesian3(position.x-distances.x/2,position.y-distances.y/2,position.z-distances.z/2);

                        that._editingObj.nodes[pos].position = that._editingObj._path[that._editingObj._nodePos[pos]];
                        that._editingObj.nodes[pos-1].position = that._editingObj._path[that._editingObj._nodePos[pos-1]];
                    } else {
                        if (pos % 2 === 0) {
                            that._editingObj._positions[pos / 2] = position;
                            var distances1 = {
                                x : position.x - that._editingObj._positions[pos / 2-1].x,
                                y : position.y - that._editingObj._positions[pos / 2-1].y,
                                z : position.z - that._editingObj._positions[pos / 2-1].z
                            };
                            var distances2 = {
                                x : that._editingObj._positions[pos / 2+1].x - position.x,
                                y : that._editingObj._positions[pos / 2+1].y - position.y,
                                z : that._editingObj._positions[pos / 2+1].z - position.z
                            };

                            that._editingObj._path[pos-1]=new Cesium.Cartesian3(position.x-distances1.x/2,position.y-distances1.y/2,position.z-distances1.z/2);
                            that._editingObj._path[pos]=position;
                            that._editingObj._path[pos+1]=new Cesium.Cartesian3(position.x+distances2.x/2,position.y+distances2.y/2,position.z+distances2.z/2);

                            that._editingObj.nodes[pos - 1].position = that._editingObj._path[that._editingObj._nodePos[pos - 1]];
                            that._editingObj.nodes[pos].position = that._editingObj._path[that._editingObj._nodePos[pos]];
                            that._editingObj.nodes[pos + 1].position = that._editingObj._path[that._editingObj._nodePos[pos + 1]];
                        } else {
                            var distances1 = {
                                x : position.x - that._editingObj._positions[(pos-1) / 2].x,
                                y : position.y - that._editingObj._positions[(pos-1) / 2].y,
                                z : position.z - that._editingObj._positions[(pos-1) / 2].z
                            };
                            var distances2 = {
                                x : that._editingObj._positions[(pos+1) / 2].x - position.x,
                                y : that._editingObj._positions[(pos+1) / 2].y - position.y,
                                z : that._editingObj._positions[(pos+1) / 2].z - position.z
                            };

                            that._editingObj._path[pos] = position;
                            that._editingObj.nodes[pos].position= position;
                        }
                    }
                }

            } else {
                var endPoint = that._viewer.camera.pickEllipsoid(movement.endPosition, that._viewer.scene.globe.ellipsoid);
                var startPoint = that._viewer.camera.pickEllipsoid(movement.startPosition, that._viewer.scene.globe.ellipsoid);
                if(!Cesium.defined(endPoint)||!Cesium.defined(startPoint)){
                    return;
                }

                var distances = {
                    x : endPoint.x - startPoint.x,
                    y : endPoint.y - startPoint.y,
                    z : endPoint.z - startPoint.z
                };

                that._editingObj._positions.forEach(function(position) {
                    position.x += distances.x;
                    position.y += distances.y;
                    position.z += distances.z;
                });

                if(that._editingObj.isUsingTerrain){
                    terrainSamplePositions = [];
                    that._editingObj._nodePos = [0];
                    for (var i = 1; i < that._editingObj._positions.length; ++i) {
                        flatPositions = Cesium.PolylinePipeline.generateArc({
                            positions : [that._editingObj._positions[i - 1], that._editingObj._positions[i]],
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
                        that._editingObj._nodePos.push(that._editingObj._nodePos[that._editingObj._nodePos.length - 1] + parseInt((terrainSamplePositions.length - 1 - that._editingObj._nodePos[that._editingObj._nodePos.length - 1]) / 2));
                        that._editingObj._nodePos.push(terrainSamplePositions.length - 1);
                    }

                    Cesium.when(Cesium.sampleTerrainMostDetailed(that._viewer.terrainProvider, terrainSamplePositions), function(samples) {
                        that._editingObj._path = that._ellipsoid.cartographicArrayToCartesianArray(samples);

                        for (var i = 0; i < that._editingObj._nodePos.length; i++) {
                            that._editingObj.nodes[i].position = that._editingObj._path[that._editingObj._nodePos[i]];
                        }
                    });
                }else {
                    that._editingObj._path=[];
                    for (var i = 0; i < that._editingObj._positions.length; i++) {
                        if(i>0){
                            var distances1 = {
                                x : that._editingObj._positions[i].x - that._editingObj._positions[i-1].x,
                                y : that._editingObj._positions[i].y - that._editingObj._positions[i-1].y,
                                z : that._editingObj._positions[i].z - that._editingObj._positions[i-1].z
                            };
                            that._editingObj._path.push(new Cesium.Cartesian3(that._editingObj._positions[i].x-distances1.x/2,that._editingObj._positions[i].y-distances1.y/2,that._editingObj._positions[i].z-distances1.z/2));
                        }

                        that._editingObj._path.push(that._editingObj._positions[i]);
                    }

                    for (var i = 0; i < that._editingObj._nodePos.length; i++) {
                        that._editingObj.nodes[i].position = that._editingObj._path[that._editingObj._nodePos[i]];
                    }
                }

            }
        };

        if (this._editingObj.id.split('.')[1] === 'polyline') {
            editPolyline();
            if (this._viewer.popupWindow.isShow) {
                this._viewer.popupWindow.show();
            }
        }
    };

    DrawHelper.prototype.deleteNode = function() {
        var that = this;
        var deletePolylineNode = function() {
            var pos, options, temp;
            pos = parseInt(that._pickObj._id.split('=')[1]);
            if (that._editingObj.nodes.length <= 3) {
                that.deleteFeature(that._editingObj);
                return;
            }
            if (pos === 0) {
                for (var i = 0; i < that._editingObj.nodes.length; i++) {
                    that._viewer.entities.remove(that._editingObj.nodes[i]);
                }

                that._editingObj._positions.splice(0, 1);

                temp = that._editingObj._nodePos[2];
                that._editingObj._path.splice(0, temp);
                that._editingObj._nodePos.splice(0, 2);

                that._editingObj.nodes = [];

                for (var i = 0; i < that._editingObj._nodePos.length; i++) {
                    that._editingObj._nodePos[i] = that._editingObj._nodePos[i] - temp;
                    if (i % 2 === 0) {
                        options = {
                            id : that._editingObj.id + "_node=" + i,
                            position : that._editingObj._path[that._editingObj._nodePos[i]],
                            billboard : copyOptions({}, that._editingObj._options.icon[0])
                        };
                    } else {
                        options = {
                            id : that._editingObj.id + "_node=" + i,
                            position : that._editingObj._path[that._editingObj._nodePos[i]],
                            billboard : copyOptions({}, that._editingObj._options.icon[1])
                        };
                    }
                    options.billboard.show = true;
                    that._editingObj.nodes.push(that._viewer.entities.add(options));
                }
            } else if (pos === that._editingObj.nodes.length - 1) {
                that._viewer.entities.remove(that._editingObj.nodes[pos]);
                that._viewer.entities.remove(that._editingObj.nodes[pos - 1]);
                that._editingObj.nodes.splice(pos - 1, 2);
                that._editingObj._positions.splice(that._editingObj._positions.length - 1, 1);

                temp = that._editingObj._nodePos[that._editingObj._nodePos.length - 3];
                that._editingObj._path.splice(temp + 1, that._editingObj._path.length - temp - 1);
                that._editingObj._nodePos.splice(that._editingObj._nodePos.length - 2, 2);
            } else {
                if (pos % 2 === 0) {
                    for (var i = 0; i < that._editingObj.nodes.length; i++) {
                        that._viewer.entities.remove(that._editingObj.nodes[i]);
                    }

                    if(that._editingObj.isUsingTerrain){
                        var path1 = that._editingObj._path.slice(0, that._editingObj._nodePos[pos - 2]);
                        var path2 = that._editingObj._path.slice(that._editingObj._nodePos[pos + 2] + 1);

                        var terrainSamplePositions = [];
                        var flatPositions = Cesium.PolylinePipeline.generateArc({
                            positions : [that._editingObj._positions[pos / 2 - 1], that._editingObj._positions[pos / 2 + 1]],
                            granularity : 0.000001
                        });

                        for (var i = 0; i < flatPositions.length; i += 3) {
                            terrainSamplePositions.push(that._ellipsoid.cartesianToCartographic(Cesium.Cartesian3.unpack(flatPositions, i)));
                        }

                        Cesium.when(Cesium.sampleTerrainMostDetailed(that._viewer.terrainProvider, terrainSamplePositions), function(samples) {

                            temp = that._editingObj._nodePos[pos + 2] - that._editingObj._nodePos[pos - 2];
                            that._editingObj._path = path1.concat(that._ellipsoid.cartographicArrayToCartesianArray(samples));
                            that._editingObj._path = that._editingObj._path.concat(path2);

                            that._editingObj._nodePos.splice(pos, 2);
                            that._editingObj._positions.splice(pos / 2, 1);

                            that._editingObj._nodePos[pos - 1] = that._editingObj._nodePos[pos - 2] + parseInt(samples.length / 2) - 1;

                            for (var j = pos; j < that._editingObj._nodePos.length; j++) {
                                that._editingObj._nodePos[j] = that._editingObj._nodePos[j] + samples.length - 1 - temp;
                            }

                            that._editingObj.nodes = [];

                            for (var i = 0; i < that._editingObj._nodePos.length; i++) {
                                if (i % 2 === 0) {
                                    options = {
                                        id : that._editingObj.id + "_node=" + i,
                                        position : that._editingObj._path[that._editingObj._nodePos[i]],
                                        billboard : copyOptions({}, that._editingObj._options.icon[0])
                                    };
                                } else {
                                    options = {
                                        id : that._editingObj.id + "_node=" + i,
                                        position : that._editingObj._path[that._editingObj._nodePos[i]],
                                        billboard : copyOptions({}, that._editingObj._options.icon[1])
                                    };
                                }
                                options.billboard.show = true;
                                that._editingObj.nodes.push(that._viewer.entities.add(options));
                            }
                        });
                    }else {
                        that._editingObj._path.splice(pos, 2);
                        var distances = {
                            x : that._editingObj._path[pos].x - that._editingObj._path[pos-2].x,
                            y : that._editingObj._path[pos].y - that._editingObj._path[pos-2].y,
                            z : that._editingObj._path[pos].z - that._editingObj._path[pos-2].z
                        };
                        that._editingObj._path[pos-1]=new Cesium.Cartesian3(that._editingObj._path[pos].x-distances.x/2,that._editingObj._path[pos].y-distances.y/2,that._editingObj._path[pos].z-distances.z/2);
                        that._editingObj._nodePos.splice(that._editingObj._nodePos.length-2, 2);
                        that._editingObj._positions.splice(pos / 2, 1);

                        that._editingObj.nodes = [];

                        for (var i = 0; i < that._editingObj._nodePos.length; i++) {
                            if (i % 2 === 0) {
                                options = {
                                    id : that._editingObj.id + "_node=" + i,
                                    position : that._editingObj._path[that._editingObj._nodePos[i]],
                                    billboard : copyOptions({}, that._editingObj._options.icon[0])
                                };
                            } else {
                                options = {
                                    id : that._editingObj.id + "_node=" + i,
                                    position : that._editingObj._path[that._editingObj._nodePos[i]],
                                    billboard : copyOptions({}, that._editingObj._options.icon[1])
                                };
                            }
                            options.billboard.show = true;
                            that._editingObj.nodes.push(that._viewer.entities.add(options));
                        }
                    }

                }
            }

        };

        if (Cesium.defined(this._pickObj) && Cesium.defined(this._editingObj)) {
            if (this._editingObj.id.split('.')[1].substr(0, 8) === 'polyline' && this._pickObj._id.split('.')[1].substr(0, 13) === 'polyline_node') {
                deletePolylineNode();
            }
        }
    };

    DrawHelper.prototype.startEdit = function() {
        this._enableEdit = true;
        this._viewer.popupWindow.setVisible(false);
    };

    DrawHelper.prototype.stopEdit = function() {
        this._enableEdit = false;
        this.disableEdit();
    };

    DrawHelper.prototype.getPolylineById = function (id) {
        for (var i = 0; i < this._polylines.length; i++) {
            if (this._polylines[i].id === id) {
                return this._polylines[i];
                break;
            }
        }
    };

    DrawHelper.prototype.addPolyline = function (positions, options) {
        options = Cesium.defined(options) ? options : {};
        options.isUsingTerrain = true;
        var polyline = new this.Polyline(this._viewer, positions, options);
        this._polylines.push(polyline);

        return polyline;
    };
    DrawHelper.prototype.removePolylineById = function (id) {
        var polyline = this.getPolylineById(id);
        polyline.remove();

        for (var i = 0; i < this._polylines.length; i++) {
            if (this._polylines[i].id === id) {
                this._polylines.splice(i, 1);
                break;
            }
        }
    };

    return DrawHelper;
});