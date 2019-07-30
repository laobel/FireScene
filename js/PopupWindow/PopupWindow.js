/*global Cesium*/

define([], function () {
    'use strict';

    var screenSpacePos = new Cesium.Cartesian2();

    function PopupWindow(viewer) {
        if (!Cesium.defined(viewer)) {
            throw new Cesium.DeveloperError("widget or viewer is required!");
        }

        var element=document.createElement('div');
        element.className='popupwindow';

        var arrowElement=document.createElement('div');
        arrowElement.className='arrow';
        element.appendChild(arrowElement);

        var titleElement=document.createElement('h3');
        titleElement.className='title';
        element.appendChild(titleElement);

        var contentElement=document.createElement('div');
        contentElement.className='content';
        element.appendChild(contentElement);

        viewer.container.appendChild(element);

        this._viewer=viewer;
        this.element=element;
        this.titleElement=titleElement;
        this.contentElement=contentElement;

        this.position = undefined;

        this.ax = 0;
        this.ay = 0;

        this.isShow = false;

        this._init();
    }

    PopupWindow.prototype._init = function() {
        var that = this;

        this._viewer.scene.preRender.addEventListener(function() {
            if (Cesium.defined(that.position)) {
                //var canvasPosition = that._viewer.scene.cartesianToCanvasCoordinates(that.position);
                var canvasPosition = computeScreenSpacePosition(that._viewer.scene,that.position);
                if (Cesium.defined(canvasPosition)) {
                    that.element.style.top = canvasPosition.y - that.element.clientHeight + that.ay + 'px';
                    that.element.style.left = canvasPosition.x -126+ that.ax + 'px';
                }
            }
        });
    };

    PopupWindow.prototype.setPosition = function(position) {
        if (!Cesium.defined(position)) {
            return;
        }
        this.position = position;
    };

    PopupWindow.prototype.setVisible = function(bool,callback) {
        if (bool) {
            if(Cesium.defined(callback)){
                callback();
            }
            this.element.style.display = "block";
            this.isShow = true;
        } else {
            if(Cesium.defined(callback)){
                callback();
            }
            this.element.style.display = "none";
            this.isShow = false;
        }
    };

    PopupWindow.prototype.show = function() {
        this.titleElement.innerHTML = this.title;
        this.contentElement.innerHTML = this.description;
        this.setVisible(true);
    };
    PopupWindow.prototype.showAt = function(position, title, description,ax,ay) {
        this.ax=Cesium.defined(ax)?ax:this.ax;
        this.ay=Cesium.defined(ay)?ay:this.ay;
        this.position = position;
        this.title = title;
        this.description = description;
        this.show();
    };

    function computeScreenSpacePosition (scene,position) {
        return Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, position,screenSpacePos);
    }

    return PopupWindow;
});