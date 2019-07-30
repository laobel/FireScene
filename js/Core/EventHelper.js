/*global Cesium*/
define([
    '../Core/deepClone',
    '../Core/DrawMode',
    '../Core/copyOptions'
], function (
    deepClone,
    DrawMode,
    copyOptions
) {
    'use strict';

    //拾取对象
    function getPicked(eventHelper, screenPosition) {
        var that = eventHelper;
        var viewer = that.viewer;
        var picked = undefined;
        var pickedObjects = viewer.scene.drillPick(screenPosition);

        for (var i = 0; i < pickedObjects.length; i++) {
            var temp = Cesium.defaultValue(pickedObjects[i].id, pickedObjects[i].primitive.id);
            if (viewer.drawHelper.editing && Cesium.defined(viewer.drawHelper.editingObj)) {
                if (temp._id.indexOf('.') > 0 && temp._id.split('.')[0] === viewer.drawHelper.editingObj.id.split('.')[0]) {
                    picked = pickedObjects[i];
                    break;
                } else {
                    picked = undefined;
                }
            } else {
                picked = Cesium.defined(pickedObjects[i]) ? pickedObjects[i] : undefined;
            }
        }

        return picked;
    }

    //单击鼠标更新绘制线
    function clickUpdateDrawPolyline(eventHelper, cartesian) {
        var that = eventHelper;
        that._clickFinish = true;
        if (that._doubleClick) {
            return;
        }

        var polyline = that._tempDrawPolylineGraphic;

        if (!Cesium.defined(polyline)) {
            return;
        }

        var p = polyline._positions[polyline._positions.length - 2];
        if (p.x === cartesian.x && p.y === cartesian.y && p.z === cartesian.z) {
            return;
        }

        polyline._positions.push(cartesian);
        polyline._nodePos.push(polyline._nodePos[polyline._nodePos.length - 1] + 1);
        polyline._nodePos.push(polyline._nodePos[polyline._nodePos.length - 1] + 1);
        polyline._path.push(cartesian);
        polyline._path.push(cartesian);

        var option1 = {
            id: polyline.id + "_node=" + (polyline._nodePos.length - 2).toString(),
            position: polyline._path[polyline._nodePos[polyline._nodePos.length - 2]],
            billboard: copyOptions({}, polyline._options.nodes[1])
        };

        if (Cesium.defined(option1)) {
            polyline.nodes.push(that._viewer.entities.add(option1));
        }

        var option2 = {
            id: polyline.id + "_node=" + (polyline._nodePos.length - 1).toString(),
            position: polyline._path[polyline._nodePos[polyline._nodePos.length - 1]],
            billboard: copyOptions({}, polyline._options.nodes[0])
        };
        option2.billboard.show = true;
        if (Cesium.defined(option2)) {
            polyline.nodes.push(that._viewer.entities.add(option2));
        }

        console.log(polyline._positions);
    }

    //鼠标移动拾取要素事件
    function clickPick(eventHelper, event,cartesian) {
        var that = eventHelper;
        var viewer = that.viewer;

        var picked = getPicked(that, event.position);
        if (Cesium.defined(picked)) {
            var pickObj = Cesium.defaultValue(picked.id, picked.primitive.id);
            if (viewer.drawHelper._enableEdit) {
                if (!viewer.drawHelper.editing) {
                    viewer.drawHelper.disableHighLight();
                    if (pickObj._id.split('.')[1].substr(0, 8) === 'polyline') {
                        viewer.drawHelper.editingObj = viewer.drawHelper.highLightObj = viewer.drawHelper.getPolylineById(pickObj._id.split('.')[0] + ".polyline");
                    }

                    viewer.drawHelper.setEdit();
                } else {
                    viewer.drawHelper.disableEdit();
                }
            }else {
                if (pickObj._id.split('.')[1].substr(0, 8) === 'polyline') {
                    viewer.drawHelper.editingObj =  viewer.drawHelper.highlightedObj =  viewer.drawHelper.getPolylineById(pickObj._id.split('.')[0] + ".polyline");
                }
                viewer.drawHelper.showInfoBox(cartesian);
            }
        } else {
            viewer.drawHelper.disableEdit();
            viewer.drawHelper.editingObj=undefined;
            viewer.popupWindow.setVisible(false);
        }
    }

    //鼠标单击事件
    function leftClickEvent(eventHelper, event) {
        var that = eventHelper;
        that._doubleClick = false;

        var viewer = that.viewer;
        var polyline = that._tempDrawPolylineGraphic;

        var ray = viewer.scene.camera.getPickRay(event.position);
        var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        cartesian = Cesium.defined(cartesian) ? cartesian : viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid);

        if (!Cesium.defined(cartesian)) {
            return;
        }

        if (viewer.drawHelper.drawing) {
            switch (viewer.drawHelper.drawMode) {
                case DrawMode.DRAWPOINT:
                    break;
                case DrawMode.DRAWLINE:
                    that._clickCartesian = cartesian;
                    if (Cesium.defined(polyline)) {
                        that._clickFinish = false;
                        setTimeout(function () {
                            clickUpdateDrawPolyline(that, cartesian);
                            that._clickCartesian = undefined;
                        }, 250);
                    }
                    break;
            }
        } else {
            clickPick(that, event,cartesian);
        }
    }

    //鼠标移动更新绘制线
    function moveUpdateDrawPolyline(eventHelper, event, cartesian) {
        var that = eventHelper;
        var polyline = that._tempDrawPolylineGraphic;

        for (var i = 0; i < polyline.nodes.length; i++) {
            if (i % 2 === 0) {
                polyline.nodes[i].billboard.show = true;
            }
        }

        if (that._mouseDown.x === event.endPosition.x && that._mouseDown.y === event.endPosition.y) {
            return;
        }

        if (polyline.isUsingTerrain) {
            var pos = polyline._nodePos.length - 1;
            var path = polyline._path.slice(0, polyline._nodePos[pos - 2]);

            var terrainSamplePositions = [];
            var flatPositions = Cesium.PolylinePipeline.generateArc({
                positions: [polyline._positions[polyline._positions.length - 2], cartesian],
                granularity: 0.000001
            });

            for (var i = 0; i < flatPositions.length; i += 3) {
                terrainSamplePositions.push(that._ellipsoid.cartesianToCartographic(Cesium.Cartesian3.unpack(flatPositions, i)));
            }

            polyline._nodePos[pos - 1] = polyline._nodePos[pos - 2] + parseInt((terrainSamplePositions.length - 1) / 2);
            polyline._nodePos[pos] = polyline._nodePos[pos - 2] + terrainSamplePositions.length - 1;

            Cesium.when(Cesium.sampleTerrainMostDetailed(that._viewer.terrainProvider, terrainSamplePositions), function (samples) {
                polyline._path = path.concat(that._ellipsoid.cartographicArrayToCartesianArray(samples));
                polyline._positions[polyline._positions.length - 1] = polyline._path[polyline._path.length - 1];
                polyline.nodes[pos].position = polyline._path[polyline._nodePos[pos]];
                polyline.nodes[pos - 1].position = polyline._path[polyline._nodePos[pos - 1]];
                polyline.nodes[pos - 2].position = polyline._path[polyline._nodePos[pos - 2]];

                for (var i = 0; i < polyline.nodes.length; i++) {
                    if (i % 2 === 0) {
                        polyline.nodes[i].billboard.show = true;
                    }
                }
            });
        } else {
            polyline._positions[polyline._positions.length - 1] = cartesian;

            var distances = {
                x: cartesian.x - polyline._positions[polyline._positions.length - 2].x,
                y: cartesian.y - polyline._positions[polyline._positions.length - 2].y,
                z: cartesian.z - polyline._positions[polyline._positions.length - 2].z
            };
            polyline._path[polyline._path.length - 2] = new Cesium.Cartesian3(cartesian.x - distances.x / 2, cartesian.y - distances.y / 2, cartesian.z - distances.z / 2);
            polyline._path[polyline._path.length - 1] = cartesian;

            polyline.nodes[polyline.nodes.length - 1].position = polyline._path[polyline._nodePos[polyline.nodes.length - 1]];
            polyline.nodes[polyline.nodes.length - 2].position = polyline._path[polyline._nodePos[polyline.nodes.length - 2]];

            for (var i = 0; i < polyline.nodes.length; i++) {
                if (i % 2 === 0) {
                    polyline.nodes[i].billboard.show = true;
                }
            }
        }
    }

    //鼠标移动拾取要素事件
    function movePick(eventHelper, event,cartesian) {
        var that = eventHelper;
        var viewer = that.viewer;

        var picked = getPicked(that, event.endPosition);
        if (Cesium.defined(picked)) {
            var pickObj = Cesium.defaultValue(picked.id, picked.primitive.id);

            if (!viewer.drawHelper.editing) {
                viewer.drawHelper.disableNodeHightLight();
                viewer.drawHelper.pickObj = undefined;
                viewer.drawHelper.disableHighLight();

                if (pickObj._id.split('.')[1].substr(0, 8) === 'polyline') {
                    viewer.drawHelper.highLightObj = viewer.drawHelper.getPolylineById(pickObj._id.split('.')[0] + ".polyline");
                }

                viewer.drawHelper.setHighLight();
                if (viewer.drawHelper.enableEdit) {
                    viewer.toolTips.showAt(event.endPosition, "单击左键选中该实体。");
                }

            } else {
                if (!Cesium.defined(viewer.drawHelper.editingObj)) {
                    return;
                }
                if (pickObj._id.split('.')[1].substr(0, 8) === 'polyline') {
                    if (pickObj._id.split('.')[0] === viewer.drawHelper.editingObj.id.split('.')[0] && pickObj._id.split('.')[1].substr(0, 13) === 'polyline_node') {
                        if (!Cesium.defined(viewer.drawHelper.pickObj) && !viewer.drawHelper.moving) {
                            viewer.drawHelper.disableNodeHightLight();
                            viewer.drawHelper.pickObj = pickObj;
                        }
                        if (pickObj._id.split('=')[1] % 2 === 0) {
                            viewer.toolTips.showAt(event.endPosition, "按住鼠标左键拖动该节点。右键删除该节点。");
                        } else {
                            viewer.toolTips.showAt(event.endPosition, "按住鼠标左键拖动该节点。");
                        }

                        viewer.container.style.cursor = "url(" + Cesium.buildModuleUrl('../../img/DrawHelper/cur.png') + "),auto";
                        viewer.drawHelper.setNodeHightLight();
                    } else {
                        if (!Cesium.defined(viewer.drawHelper.pickObj)) {
                            if (pickObj._id.split('.')[0] === viewer.drawHelper.editingObj.id.split('.')[0]) {
                                viewer.toolTips.showAt(event.endPosition, "按住鼠标左键拖动该实体。");
                                viewer.container.style.cursor = "move";
                            }
                        }
                    }
                }
            }
        } else {
            viewer.toolTips.hide();
            /*if(Cesium.defined(viewer.drawHelper.editingObj)){
                return;
            }*/
            if (!viewer.drawHelper.moving) {
                viewer.drawHelper.disableNodeHightLight();
                viewer.drawHelper.pickObj = undefined;
            }
            if (!viewer.drawHelper.editing) {
                viewer.drawHelper.disableHighLight();
            } else {
                if (!viewer.drawHelper.moving) {
                    viewer.container.style.cursor = "default";
                }
            }
        }

        if (viewer.drawHelper.editing && viewer.drawHelper.moving && (that._mouseDown.x !== event.endPosition.x || that._mouseDown.y !== event.endPosition.y)) {
            viewer.toolTips.showAt(event.endPosition, "松开鼠标完成拖动。");
            viewer.drawHelper.editFeature(event,cartesian);
        }
    }

    //鼠标移动事件
    function mouseMoveEvent(eventHelper, event) {
        var that = eventHelper;
        var viewer = that.viewer;
        var drawHelper = viewer.drawHelper;
        var polyline = that._tempDrawPolylineGraphic;

        var ray = viewer.scene.camera.getPickRay(event.endPosition);
        var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        cartesian = Cesium.defined(cartesian) ? cartesian : viewer.camera.pickEllipsoid(event.endPosition, viewer.scene.globe.ellipsoid);

        if (!Cesium.defined(cartesian)) {
            return;
        }

        //将笛卡尔坐标转换为地理坐标
        var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        var height = parseInt(viewer.scene.globe.getHeight(cartographic));
        //将弧度转为度的十进制度表示
        var longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(3);
        var latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(3);

        if (viewer.drawHelper.drawing) {
            switch (viewer.drawHelper.drawMode) {
                case DrawMode.DRAWPOINT:
                    break;
                case DrawMode.DRAWLINE:
                    viewer.toolTips.showAt(event.endPosition, "<p>单击添加标注线的节点,双击完成标注. 当前位置是: </p>"
                        + "x:" + longitude + " , y:" + latitude + " , z:" + height);

                    if (!Cesium.defined(polyline)) {
                        if (Cesium.defined(that._clickCartesian)) {
                            that._tempDrawPolylineGraphic = drawHelper.addPolyline([that._clickCartesian, cartesian], that._polylineOptions);

                            that._clickCartesian = undefined;
                        }
                    } else {
                        if (!Cesium.defined(that._clickCartesian)) {
                            moveUpdateDrawPolyline(that, event, cartesian);
                        }
                    }
                    break;
            }
        } else {
            movePick(that, event,cartesian);
        }
    }

    //鼠标左键双击事件
    function leftDbClickEvent(eventHelper, event) {
        var that = eventHelper;
        that._doubleClick = true;

        var viewer = that.viewer;

        var ray = viewer.scene.camera.getPickRay(event.position);
        var cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        cartesian = Cesium.defined(cartesian) ? cartesian : viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid);

        if (!Cesium.defined(cartesian)) {
            return;
        }

        if (viewer.drawHelper.drawing) {
            for (var i = 0; i < that._tempDrawPolylineGraphic.nodes.length; i++) {
                that._tempDrawPolylineGraphic.nodes[i].billboard.show = false;
            }

            that._tempDrawPolylineGraphic = undefined;
            that._clickCartesian = undefined;

            viewer.drawHelper.drawing = false;

            viewer.toolTips.hide();
        } else {

        }
    }

    //按下鼠标事件
    function leftMouseDownEvent(eventHelper, event) {
        var that=eventHelper;
        var viewer=that.viewer;
        var picked = viewer.scene.pick(event.position);
        if (Cesium.defined(picked)) {
            if (viewer.drawHelper.editing) {
                var pickObj = Cesium.defaultValue(picked.id, picked.primitive.id);
                if(!Cesium.defined(viewer.drawHelper.editingObj)){
                    return;
                }
                if (pickObj._id.split('_')[0] === viewer.drawHelper.editingObj.id) {
                    viewer.drawHelper.startMoving();
                }
            }
        }
        that._mouseDown = {x : event.position.x, y : event.position.y};
    }

    //提起鼠标事件
    function leftMouseUpEvent(eventHelper, event) {
        var viewer=eventHelper.viewer;
        viewer.drawHelper.endMoving();
    }

    //右键单击事件
    function rightClickEvent(eventHelper, event) {
        var viewer=eventHelper.viewer;
        viewer.drawHelper.deleteNode();
    }

    function EventHelper(viewer) {
        if (!Cesium.defined(viewer)) {
            throw new Cesium.DeveloperError('viewer is required!');
        }

        this._viewer = viewer;
        this._ellipsoid = viewer.scene.globe.ellipsoid;

        this._polylineOptions = undefined;

        this._handler = viewer.screenSpaceEventHandler;
        this._handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this._handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        this._clickCartesian = undefined;

        this._positions = [];
        this._mouseDown = {x: undefined, y: undefined};

        this._tempDrawPolylineGraphic = undefined;

        var that = this;

        this._leftClickEvent = function (event) {
            leftClickEvent(that, event);
        };

        this._leftDbClickEvent = function (event) {
            leftDbClickEvent(that, event);
        };

        this._mouseMoveEvent = function (event) {
            mouseMoveEvent(that, event);
        };
        this._leftMouseDownEvent = function (event) {
            leftMouseDownEvent(that, event);
        };
        this._leftMouseUpEvent = function (event) {
            leftMouseUpEvent(that, event);
        };
        this._rightClickEvent = function (event) {
            rightClickEvent(that, event);
        };
    }

    Cesium.defineProperties(EventHelper.prototype, {
        viewer: {
            get: function () {
                return this._viewer;
            }
        },
        handler: {
            get: function () {
                return this._handler;
            }
        },
        leftClickEvent: {
            get: function () {
                return this._leftClickEvent;
            },
            set: function (event) {
                this._leftClickEvent = event;
            }
        },
        leftDbClickEvent: {
            get: function () {
                return this._leftDbClickEvent;
            },
            set: function (event) {
                this._leftDbClickEvent = event;
            }
        },
        mouseMoveEvent: {
            get: function () {
                return this._mouseMoveEvent;
            },
            set: function (event) {
                this._mouseMoveEvent = event;
            }
        },
        leftMouseDownEvent:{
            get: function () {
                return this._leftMouseDownEvent;
            },
            set: function (event) {
                this._leftMouseDownEvent = event;
            }
        },
        leftMouseUpEvent:{
            get: function () {
                return this._leftMouseUpEvent;
            },
            set: function (event) {
                this._leftMouseUpEvent = event;
            }
        },
        rightClickEvent:{
            get: function () {
                return this._rightClickEvent;
            },
            set: function (event) {
                this._rightClickEvent = event;
            }
        }
    });

    EventHelper.prototype.addEvent = function () {
        this.handler.setInputAction(this.leftClickEvent, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction(this.leftDbClickEvent, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        this.handler.setInputAction(this.mouseMoveEvent, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.handler.setInputAction(this.leftMouseDownEvent, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.handler.setInputAction(this.leftMouseUpEvent, Cesium.ScreenSpaceEventType.LEFT_UP);
        this.handler.setInputAction(this.rightClickEvent, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    };

    return EventHelper;

});