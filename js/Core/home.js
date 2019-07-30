/*global Cesium*/

define([

],function () {
    'use strict';

    var longitude = 115.16;
    var latitude = 25.71;
    longitude = 102.65;
    latitude = 24.90;
    var height = 10000;
    var heading = Cesium.Math.toRadians(0);
    var pitch = Cesium.Math.toRadians(-90);
    var roll = Cesium.Math.toRadians(0);


    function setView(viewer) {
        viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            orientation: {
                heading : heading,
                pitch : pitch,
                roll : roll
            }
        });
    }

    function flyTo(viewer,duration) {
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, viewer.camera.positionCartographic.height),
            duration: duration,
            easingFunction: Cesium.EasingFunction.LINEAR_NONE,
            complete: function () {
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
                    })
            }
        });
    }


    function home(viewer,shouldAnimate,duration) {
        if (!Cesium.defined(viewer)) {
            throw new Cesium.DeveloperError('viewer is required!');
        }
        if(!Cesium.defined(shouldAnimate)){
            shouldAnimate=true;
        }
        if(!Cesium.defined(duration)){
            duration=2.0;
        }

        if(shouldAnimate){
            return flyTo(viewer,duration);
        }else {
            return setView(viewer);
        }
    }

    return home;
});