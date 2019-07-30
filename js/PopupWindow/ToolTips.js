/*global Cesium*/
define([
],function (
) {
    'use strict';

    function ToolTips(viewer) {
        if (!Cesium.defined(viewer)) {
            throw new Cesium.DeveloperError('viewer is required!');
        }

        this._container=viewer.container.firstChild;

        var panal = document.createElement('DIV');
        panal.className = "tooltips left";

        var arrow = document.createElement('DIV');
        arrow.className = "tooltips-arrow";
        panal.appendChild(arrow);

        var title = document.createElement('DIV');
        title.className = "tooltips-inner";
        panal.appendChild(title);

        this._title = title;
        this._panal = panal;
        this._direction='left';

        this._container.appendChild(panal);

        this.isShow = false;
    }

    Cesium.defineProperties(ToolTips.prototype, {
        container:{
            get:function () {
                return this._container;
            }
        },
        panal:{
            get:function () {
                return this._panal;
            }
        },
        direction:{
            get:function () {
                return this._direction;
            },
            set:function (value) {
                this._direction=value;
            }
        }
    });

    ToolTips.prototype.setVisible = function(bool) {
        if (bool) {
            this.panal.style.display = "block";
            this.isShow = true;
        } else {
            this.panal.style.display = "none";
            this.isShow = false;
        }
    };

    ToolTips.prototype.show = function() {
        this.setVisible(true);
    };
    ToolTips.prototype.hide = function() {
        this.setVisible(false);
    };
    ToolTips.prototype.showAt = function(position, message) {
        if (position && message) {
            this.setVisible(true);
            this._title.innerHTML = message;
            if(this._direction==='right'){
                this.panal.style.left = position.x + 10 + "px";
                this.panal.style.top = (position.y - this.panal.clientHeight / 2) + "px";
            }else {
                this.panal.style.left = position.x - this.panal.clientWidth -10 + "px";
                this.panal.style.top = (position.y - this.panal.clientHeight / 2) + "px";
            }

        }
    };

    /**
     * @returns {Boolean} true if the object has been destroyed, false otherwise.
     */
    ToolTips.prototype.isDestroyed = function () {
        return false;
    };

    /**
     * Destroys the ToolTips.  Should be called if permanently
     * removing the ToolTips from layout.
     */
    ToolTips.prototype.destroy = function () {
        this.container.removeChild(this.panal);

        return Cesium.destroyObject(this);
    };

    return ToolTips;
});

