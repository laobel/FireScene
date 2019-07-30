/*global Cesium*/
define([
    './ToolBarViewModel'
], function (
    ToolBarViewModel
) {
    'use strict';

    /**
     * 创建工具条
     * @param viewer
     * @constructor
     */
    function ToolBar(viewer) {
        if (!Cesium.defined(viewer)) {
            throw new Cesium.DeveloperError('viewer is required!');
        }

        var element = document.createElement('div');
        element.className = 'toolbar';
        element.setAttribute('data-bind', 'click: activeCommand');

        var topElement = document.createElement('div');
        topElement.className = 'topbar';

        var homeElement = document.createElement('div');
        homeElement.className = 'bar-item';
        homeElement.title = '初始位置';
        homeElement.innerHTML = '<i class="home"></i>';
        homeElement.setAttribute('data-bind', 'click: homeCommand,css:{\'active\':activeElement===\'home\'},');
        topElement.appendChild(homeElement);

        var addLineElement = document.createElement('div');
        addLineElement.className = 'bar-item';
        addLineElement.title = '添加线';
        addLineElement.innerHTML = '<i class="drawLine"></i>';
        addLineElement.setAttribute('data-bind', 'click: addLineCommand,css:{\'active\':activeElement===\'drawLine\'}');
        topElement.appendChild(addLineElement);

        var drawLineElement = document.createElement('div');
        drawLineElement.className = 'bar-item';
        drawLineElement.title = '绘制线';
        drawLineElement.innerHTML = '<i class="drawLine"></i>';
        drawLineElement.setAttribute('data-bind', 'click: drawLineCommand,css:{\'active\':activeElement===\'drawLine\'}');
        topElement.appendChild(drawLineElement);

        element.appendChild(topElement);

        var centerElement = document.createElement('div');
        centerElement.className = 'centerbar';

        var centerPanal = document.createElement('div');
        centerPanal.className = 'panal';

        var openTerrainElement = document.createElement('div');
        openTerrainElement.className = 'bar-item';
        openTerrainElement.title = '打开地形';
        openTerrainElement.innerHTML = '<i class="startEdit"></i>';
        openTerrainElement.setAttribute('data-bind', 'click: openTerrainCommand,css:{\'active\':activeElement===\'startEdit\'}');
        centerPanal.appendChild(openTerrainElement);

        var closeTerrainElement = document.createElement('div');
        closeTerrainElement.className = 'bar-item';
        closeTerrainElement.title = '关闭地形';
        closeTerrainElement.innerHTML = '<i class="startEdit"></i>';
        closeTerrainElement.setAttribute('data-bind', 'click: closeTerrainCommand,css:{\'active\':activeElement===\'startEdit\'}');
        centerPanal.appendChild(closeTerrainElement);

        var startEditElement = document.createElement('div');
        startEditElement.className = 'bar-item';
        startEditElement.title = '开始编辑';
        startEditElement.innerHTML = '<i class="startEdit"></i>';
        startEditElement.setAttribute('data-bind', 'click: startEditCommand,css:{\'active\':activeElement===\'startEdit\'}');
        centerPanal.appendChild(startEditElement);

        var stopEditElement = document.createElement('div');
        stopEditElement.className = 'bar-item';
        stopEditElement.title = '停止编辑';
        stopEditElement.innerHTML = '<i class="stopEdit"></i>';
        stopEditElement.setAttribute('data-bind', 'click: stopEditCommand,css:{\'active\':activeElement===\'stopEdit\'}');
        centerPanal.appendChild(stopEditElement);

        centerElement.appendChild(centerPanal);

        element.appendChild(centerElement);

        var bottomElement = document.createElement('div');
        bottomElement.className = 'bottombar';

        var printElmement = document.createElement('div');
        printElmement.className = 'bar-item';
        printElmement.title = '打印';
        printElmement.innerHTML = '<i class="print"></i><span>打印</span>';
        printElmement.setAttribute('data-bind', 'click:screenCaptureCommand ,css:{\'active\':activeElement===\'print\'}');
        bottomElement.appendChild(printElmement);

        var guideElement = document.createElement('div');
        guideElement.className = 'bar-item';
        guideElement.title = '引导';
        guideElement.innerHTML = '<i class="guide"></i><span>引导</span>';
        guideElement.setAttribute('data-bind', 'click: ,css:{\'active\':activeElement===\'guide\'}');
        bottomElement.appendChild(guideElement);

        element.appendChild(bottomElement);

        document.body.appendChild(element);

        var viewModel = new ToolBarViewModel(viewer);
        Cesium.knockout.applyBindings(viewModel, element);

        this._element = element;
        this._homeElement = homeElement;
        this._drawLineElement = drawLineElement;

        this._startEditElement = startEditElement;
        this._stopEditElement = stopEditElement;

        this._printElement = printElmement;
        this._guideElement = guideElement;


        this._viewModel = viewModel;
    }

    Cesium.defineProperties(ToolBar.prototype, {
        /**
         * Gets the view model.
         * @memberof ToolBar.prototype
         *
         * @type {ToolBarViewModel}
         */
        viewModel: {
            get: function () {
                return this._viewModel;
            }
        },
        element:{
            get:function () {
                return this._element;
            }
        }
    });

    /**
     * @returns {Boolean} true if the object has been destroyed, false otherwise.
     */
    ToolBar.prototype.isDestroyed = function () {
        return false;
    };

    /**
     * Destroys the ToolBar.  Should be called if permanently
     * removing the ToolBar from layout.
     */
    ToolBar.prototype.destroy = function () {
        Cesium.knockout.cleanNode(this._element);
        document.body.removeChild(this._element);

        return Cesium.destroyObject(this);
    };

    return ToolBar;
});