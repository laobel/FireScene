/*global define,Cesium*/
define([
    './Core/home',
    './PopupWindow/PopupWindow',
    './PopupWindow/ToolTips',
    './Draw/DrawHelper',
    './Core/EventHelper',
    './ToolBar/ToolBar',
    'domReady!'
],function (
    home,
    PopupWindow,
    ToolTips,
    DrawHelper,
    EventHelper,
    ToolBar
) {
    'use strict';

    var loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';

    var tdtImgProvider= new Cesium.WebMapTileServiceImageryProvider({
        url: "http://{s}.tianditu.com/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles",
        layer: "tdtImgBasicLayer",
        style: "default",
        subdomains:['t0','t1','t2','t3','t4','t5','t6','t7'],
        format: "image/jpeg",
        tileMatrixSetID: "GoogleMapsCompatible",
        maximumLevel: 17,
        credit:"",
        show: true
    });
    var terrainProvider=new Cesium.CesiumTerrainProvider({
        //url : 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
       /* url : '//assets.agi.com/stk-terrain/world',*/
        url: 'http://182.247.253.75/stk-terrain/tiles',
        requestWaterMask : true,
        credit:"",
        requestVertexNormals : true
        //proxy : new Cesium.DefaultProxy('/terrain/')

    });

    var viewer=new Cesium.Viewer('container', {
        imageryProvider:tdtImgProvider,
        terrainProvider:terrainProvider,
        animation:false,
        baseLayerPicker:false,
        fullscreenButton:false,
        geocoder:false,
        homeButton:false,
        infoBox:false, 
        sceneModePicker:false,
        selectionIndicator:false,
        terrainExaggeration:3.5,
        timeline:false
    });

    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 500;//设置相机最小缩放距离,距离地表500米


    viewer.home=home;
    viewer.drawHelper=new DrawHelper(viewer);
    viewer.popupWindow=new PopupWindow(viewer);
    viewer.toolTips=new ToolTips(viewer);
    viewer.eventHelper=new EventHelper(viewer);
    viewer.toolBar=new ToolBar(viewer);

    viewer.home(viewer,true);
    viewer.eventHelper.addEvent();

    //等待动画结束后执行
    setTimeout(function () {
        loadingIndicator.style.display = 'none';
    },2000);
});