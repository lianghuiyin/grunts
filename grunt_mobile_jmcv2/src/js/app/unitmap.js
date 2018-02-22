MobileApp.UnitsceneUnitmapRoute = Ember.Route.extend({
    beforeModel: function(transition) {
        if(!this.controllerFor("unitscene").get("unit_config")){
            transition.send("goBack");
        }
    },
    setupController: function(controller, model) {
        var unitsceneController = controller.get("controllers.unitscene");
        var unitId = unitsceneController.get("unit_config.unit_id");
        model.set("unit_id",unitId);
        var expId = unitsceneController.get("experiment.exp_id");
        model.set("exp_id",expId);
        var carNo = unitsceneController.get("car.car_no");
        model.set("car_no",carNo);
        var placeLat = unitsceneController.get("place.lat");
        model.set("place_lat",placeLat);
        var placeLng = unitsceneController.get("place.lng");
        model.set("place_lng",placeLng);
        var placeZoom = unitsceneController.get("place.zoom");
        model.set("place_zoom",placeZoom);
        controller.set("model",model);
    },
    activate:function(){
        
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.get("controller");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        
        var controller = this.controllerFor("unitscene_unitmap");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            MobileApp.transitionAnimation = "slideHorizontal";
            this.transitionTo('unitscene');
        }
    }
});
MobileApp.Unitmap = MobileApp.Model.extend({
    members:["unit_id","car_no","place_lat","place_lng","place_zoom"],
    action:"unitmap",
    unit_id: null,
    exp_id:null,
    car_no:null,
    place_lat:null,
    place_lng:null,
    place_zoom:null
});

MobileApp.LastDataByUnitFetcher = MobileApp.Model.extend({
    members:["token","log_id","unit"],
    action:"fetch_last_data_by_unit",
    token: "",
    log_id:"",
    unit: ""
});

MobileApp.UnitsceneUnitmapView = Ember.View.extend({
    classNames:['unitscene-unitmap','navigable-pane','collapse','h100per']
});

MobileApp.UnitsceneUnitmapController = Ember.ObjectController.extend({
    needs:["session","unitscene","map_offset","marker_icon","google_script"],
    mapTipText:"",
    isMapLoading:false,
    loadingText:"",
    enableMapOffset:true,
    mapCanvas:null,
    lastDatas:[], //最新接收到的数据，可能有多条数据
    preDatas:[], //上一次接收到的数据，即上一个lastDatas
    isTraceStarted:false,
    dataRefreshRate:2000,//数据刷新频率，这里定义时长，单位为毫秒
    timerForStartTrace:null,
    timerForMapOffset:null,
    isNeedToFilterErrDots:false,
    infoMode: "follow", //fix,follow
    maxLineLength: 10,
    defaultMaxLineLength: 1000,
    showOutlineMapMarker: true,
    hasTriggerMapOffset: false,
    hasGetMapOffset: false,
    isNeedToSetCenter:true,
    isAlarmSpeedsEnable:false,
    baseLatLngForMapOffset:null,//mapOffset基于latLng
    isAlarmPositionEnable:false,
    mapOffset: { offsetLngX: 0, offsetLatY: 0 },
    mapIconColor:"FE7569",//实验id对应的实验类型下的地图图标颜色
    traceMapObjName: "trace",
    traceMode: "none", //line、point、none
    autoClear: true,
    traceWidth:50,
    speedAreas:[],
    /**
     * [checkTimeErr 校验数据接收时间是否大于等于最后一条数据的接收时间]
     * @param  {[string]} receiveTime [要校验的数据接收时间]
     * @return {[boolean]}             [是否通过校验]
     */
    checkTimeErr:function(receiveTime){
        var lastDatas = this.get("lastDatas"),
            re;
        if(lastDatas.length > 0){
            var lastTime = lastDatas[lastDatas.length - 1].receiveTime;
            re = HOJS.lib.compareTime(lastTime,receiveTime);
            if(!re){
                console.warn("timeerror");
            }
            return re;
        }
        else{
            //对于第一条数据，不需要校验
            return true;
        }
    },
    /**
     * [checkForErrDot 检测数据是否合法]
     * 数据为空不合法
     * isNeedToFilterErrDots为true时不通过option设置的过虑条件不合法
     * 其他情况合法
     * @param  {[jsonObject]} dataItem [一条解析后的原始数据]
     * @return {[boolean]}          [是否合法]
     */
    checkForErrDot:function(dataItem,option){
        var reValue = false;
        var isNeedToFilterErrDots = this.get("isNeedToFilterErrDots");
        if(dataItem){
            if(isNeedToFilterErrDots){
                if(!option){
                    option = {
                        "speed":{max:250},
                        "lat":{max:53.33,min:3.51},
                        "lng":{max:135.05,min:73.33}
                    };
                }
                reValue = true;
                var tempMax,tempMin,tempValue;
                for(var k in option){
                    if(!option.hasOwnProperty(k)){
                        //防止循环到prototype
                        continue;
                    }
                    tempValue = dataItem[k];
                    tempMax = option[k].max;
                    tempMin = option[k].min;
                    if((tempValue != undefined) && ((tempMax != undefined && tempValue > tempMax) || (tempMin != undefined && tempValue < tempMin))){
                       reValue = false; 
                       break;
                    }
                }
            }
            else{
                reValue = true;
            }
        }
        if(!reValue){
            console.log("执行checkForErrDot，检测到数据不合法！");
        }
        return reValue;
    },
    filterGpsDatas:function(datas){
        return datas.filter(function(n,i){
            return n.lat > 0;
        });
    },
    setMapOffset:function(){
        var baseLatLngForMapOffset = this.get("baseLatLngForMapOffset");
        if(baseLatLngForMapOffset){
            var mapOffsetController = this.get("controllers.map_offset");
            mapOffsetController.send("fetch",{
                lat:baseLatLngForMapOffset.lat,
                lng:baseLatLngForMapOffset.lng,
                callBackForSuc:function(result){
                    var reOffsetJson = result.get("offset");
                    if (reOffsetJson != undefined && reOffsetJson.LatOffset != "" && reOffsetJson.LngOffset != "") {
                        this.set("hasGetMapOffset",true);
                        this.set("mapOffset",{
                            offsetLngX:reOffsetJson.LngOffset,
                            offsetLatY:reOffsetJson.LatOffset
                        });
                    }
                    this.resetMapOffset();
                }.switchScope(this),
                callBackForFail:function(result){
                    this.resetMapOffset();
                }.switchScope(this)
            });
        }
        else{
            this.resetMapOffset();
        }
    },
    resetMapOffset:function(){
        clearTimeout(this.get("timerForMapOffset"));
        this.set("timerForMapOffset",setTimeout(function () { 
            this.setMapOffset(); 
        }.switchScope(this), 6000));
    },
    setMapMarker:function(dataItem,preDataItem,isOutLine) {
        var carNo = this.get("car_no"),
            isTraceStarted = this.get("isTraceStarted"),
            hasGetMapOffset = this.get("hasGetMapOffset"),
            mapOffset = this.get("mapOffset"),
            mapCanvas = this.get("mapCanvas"),
            mapIconColor = this.get("mapIconColor"),
            isAlarmPositionEnable = this.get("isAlarmPositionEnable"),
            traceMapObjName = this.get("traceMapObjName"),
            traceWidth = this.get("traceWidth"),
            isAlarmSpeedsEnable = this.get("isAlarmSpeedsEnable"),
            speedAreas = this.get("speedAreas"),
            infoMode = this.get("infoMode"),
            isNeedToSetCenter = this.get("isNeedToSetCenter"),
            traceMode = this.get("traceMode"),
            autoClear = this.get("autoClear"),
            maxLineLength = this.get("maxLineLength");

        if (isTraceStarted) {
            if (hasGetMapOffset) {
                var tempLatLng = {
                    lat: dataItem.lat + mapOffset.offsetLatY,
                    lng: dataItem.lng + mapOffset.offsetLngX
                }
                mapCanvas.setMarker(tempLatLng,mapIconColor);

                if (isNeedToSetCenter && infoMode != "follow") {
                    mapCanvas.setCenter({ lat: dataItem.lat + mapOffset.offsetLatY, lng: dataItem.lng + mapOffset.offsetLngX });
                }

                //判断报警，并在报警时突出显示
                var boolAlarmPosition = false,
                    boolAlarmSpeeds = false;
                if (isAlarmPositionEnable) {
                    boolAlarmPosition = !mapCanvas.checkLatLngInAares(tempLatLng, traceMapObjName, traceWidth);
                    if (boolAlarmPosition) {
                        mapCanvas.drawAloneCircle(tempLatLng, traceWidth, { strokeColor: "yellow", fillColor: "yellow", zIndex: -60, strokeOpacity: 0.4, fillOpacity: 0.1, clickable: false });
                    }
                }

                if (isAlarmSpeedsEnable) {
                    var indexInSpeedAreas = mapCanvas.getIndexOfLatLngInRectangles(tempLatLng);
                    if (indexInSpeedAreas >= 0) {
                        var curSpeed = dataItem.speed;
                        boolAlarmSpeeds = curSpeed < speedAreas[indexInSpeedAreas].speeds.minSpeed || curSpeed > speedAreas[indexInSpeedAreas].speeds.maxSpeed;
                        if (boolAlarmSpeeds) {
                            mapCanvas.drawAloneCircle(tempLatLng, traceWidth, { strokeColor: "white", fillColor: "white", zIndex: -40, strokeOpacity: 0.6, fillOpacity: 0.1, clickable: false });
                        }
                    }
                }
                var strOfflineState = "";
                if (isOutLine) {
                    strOfflineState = '<br/><div class = "offlineState">离线</div>';
                }
                var strInfo = '<div class = "followBox">\
                        车辆:%@<br/>\
                        速度:%@<br/>\
                        接收时间:%@<br/>\
                        卫星时间:%@\
                        %@\
                    </div>'.fmt(carNo,dataItem.speed,dataItem.receiveTime,dataItem.gpsTime,strOfflineState);
                if (boolAlarmPosition) {
                    strInfo += '<span class = "red">+位置报警</span>'
                }
                if (boolAlarmSpeeds) {
                    strInfo += '<span class = "red">+速度报警</span>'
                }

                if (infoMode == "follow") {
                    mapCanvas.setInfo(strInfo);
                }
                else if (infoMode == "fix") {
                    this.set("mapTipText",strInfo);
                }

                if (traceMode != "none" && preDataItem) {
                    if (traceMode == "line" && page.checkDataLoss(dataItem,preDataItem)) {
                        var curLatLng = {},preLatLng = {},curMapOffset = mapOffset;
                        curLatLng.lat = dataItem.lat + curMapOffset.offsetLatY;
                        curLatLng.lng = dataItem.lng + curMapOffset.offsetLngX;
                        preLatLng.lat = preDataItem.lat + curMapOffset.offsetLatY;
                        preLatLng.lng = preDataItem.lng + curMapOffset.offsetLngX;
                        mapCanvas.drawAloneLine(curLatLng,preLatLng);
                        if (autoClear) {
                            mapCanvas.clearAllMarkers();
                            mapCanvas.clearPolylinesForLength(maxLineLength);
                            if(isAlarmPositionEnable || isAlarmSpeedsEnable){
                                mapCanvas.clearCirclesForLength(maxLineLength);
                            }
                        }
                        else if (defaultMaxLineLength > 0) {
                            mapCanvas.clearAllMarkers();
                            mapCanvas.clearPolylinesForLength(defaultMaxLineLength);
                            if(isAlarmPositionEnable || isAlarmSpeedsEnable){
                                mapCanvas.clearCirclesForLength(defaultMaxLineLength);
                            }
                        }
                    }
                    else if (traceMode == "point") {
                        mapCanvas.addMarker({ lat: dataItem.lat + mapOffset.offsetLatY, lng: dataItem.lng + mapOffset.offsetLngX });
                        if (autoClear) {
                            mapCanvas.clearAllPolylines();
                            mapCanvas.clearMarkersForLength(maxLineLength);
                            if(isAlarmPositionEnable || isAlarmSpeedsEnable){
                                mapCanvas.clearCirclesForLength(maxLineLength);
                            }
                        }
                        else if (defaultMaxLineLength > 0) {
                            mapCanvas.clearAllPolylines();
                            mapCanvas.clearMarkersForLength(defaultMaxLineLength);
                            if(isAlarmPositionEnable || isAlarmSpeedsEnable){
                                mapCanvas.clearCirclesForLength(defaultMaxLineLength);
                            }
                        }
                    }
                }
            }
            else {
                this.set("mapTipText","当前地图偏移数据更新失败,正在尝试更新！");
            }
        }
        else {
            this.set("mapTipText","地图加载中...");
        }
    },
    showDataItem:function(){
        var showOutlineMapMarker = this.get("showOutlineMapMarker"),
            lastDatas = this.get("lastDatas"),
            preDatas = this.get("preDatas"),
            lastData = lastDatas[lastDatas.length - 1]; 
        var lastGpsDatas = this.filterGpsDatas(lastDatas);
        var lastLastGpsData = lastGpsDatas[lastGpsDatas.length - 1];
        var preGpsDatas = this.filterGpsDatas(preDatas);
        var lastPreGpsData = preGpsDatas[preGpsDatas.length - 1];

        var minuteDiff = HOJS.lib.dateDiff("M", lastData.receiveTime, lastData.curServiceTime);
        var mapCanvas = this.get("mapCanvas");
        var isOutLine = (minuteDiff && minuteDiff >= 5);
        if (isOutLine) {
            this.set("mapTipText","该设备处于离线状态");
            if (!showOutlineMapMarker) {
                mapCanvas.clearAllMarkers();
                this.set("mapTipText","");
                return;
            }
        }
        var enableMapOffset = this.get("enableMapOffset"),
            hasTriggerMapOffset = this.get("hasTriggerMapOffset");
        if(lastLastGpsData){
            if (enableMapOffset) {
                this.set("baseLatLngForMapOffset",{
                    lat:lastLastGpsData.lat,
                    lng:lastLastGpsData.lng
                });
                if (!hasTriggerMapOffset) {
                    this.set("hasTriggerMapOffset",true);
                    this.setMapOffset();
                }
            }
        }
        var hasGetMapOffset = this.get("hasGetMapOffset");
        for(var i = 0,len = lastGpsDatas.length;i < len;i++){
            var dataItem = lastGpsDatas[i];
            var preDataItem = i == 0 ? lastPreGpsData : lastGpsDatas[i - 1];
            //数据类型为CAN+GPS数据或GPS数据时，要更新gps信息
            if (enableMapOffset) {
                if(hasGetMapOffset){
                    this.setMapMarker(dataItem,preDataItem,isOutLine);
                }
            }
            else{
                this.setMapMarker(dataItem,preDataItem,isOutLine);
            }
        }
    },
    initMap:function(){
        var googleScriptController = this.get("controllers.google_script");
        if(googleScriptController.get("isLoaded")){
            this.afterMapScriptLoaded();
        }
        else{
            googleScriptController.send("fetch",this.afterMapScriptLoaded.switchScope(this));
        }
    },
    afterMapScriptLoaded:function(){
        var expId = this.get("exp_id");
        if (!this.get("enableMapOffset")) {
            this.set("hasGetMapOffset",true);
        }
        if(expId && expId > 0){
            this.set("isMapLoading",true);
            this.send("loadMapIconColor",expId);
        }
    },
    unloadMap:function(){
        clearTimeout(this.get("timerForStartTrace"));
        clearTimeout(this.get("timerForMapOffset"));
        $("#map_canvas").remove();
        this.set("mapCanvas",null);
        this.set("isTraceStarted",false);
        this.set("lastDatas",[]);
        this.set("preDatas",[]);
        this.set("hasTriggerMapOffset",false);
        this.set("hasGetMapOffset",false);
        this.set("isNeedToSetCenter",true);
        this.set("isAlarmSpeedsEnable",false);
        this.set("baseLatLngForMapOffset",null);
        this.set("isAlarmPositionEnable",false);
        this.set("mapOffset",{ offsetLngX: 0, offsetLatY: 0 });
        this.set("mapIconColor","FE7569");
        this.set("traceMode","none");
        this.set("autoClear",true);
        this.set("traceWidth",50);
        this.set("speedAreas",[]);
    },
    actions:{
        navigablePush:function(){
            $(".unitscene-index.navigable-pane").navigablePush({
                targetTo:".unitscene-unitmap.navigable-pane",
                animation:MobileApp.transitionAnimation
            });
            MobileApp.transitionAnimation = "none";
            this.initMap();
        },
        navigablePop:function(){
            this.unloadMap();
            $(".unitscene-unitmap.navigable-pane").navigablePop({
                targetTo:".unitscene-index.navigable-pane",
                animation:MobileApp.transitionAnimation
            });
            MobileApp.transitionAnimation = "none";
        },
        loadMap:function(){
            var lat = this.get("place_lat"),
                lng = this.get("place_lng"),
                zoom = this.get("place_zoom");
            var mapCanvas = $("<div id = 'map_canvas'></div>");
            mapCanvas.appendTo(".unitscene-unitmap.navigable-pane");
            this.set("mapCanvas",mapCanvas);
            this.set("loadingText","地图加载中...");
            mapCanvas.easyGoogleMap({
                latLng: { lat: lat, lng: lng },
                zoom: zoom,
                markertitle: "Horizon整车试验车辆实时监测",
                mapLoadedFun: function () {
                    this.set("loadingText","");
                    this.set("isMapLoading",false);
                    var enableMapOffset = this.get("enableMapOffset"),
                        lastDatas = this.get("lastDatas");
                    if (enableMapOffset && lastDatas.length > 0) {
                        this.setMapOffset();
                    }
                    if (!this.get("isTraceStarted")) {
                        this.send("startTrace");
                    }
                }.switchScope(this)
            });
        },
        loadMarkerImage:function(mapIconColor){
            this.set("loadingText","地图图标加载中...");
            var markerIconController = this.get("controllers.marker_icon");
            markerIconController.send("loadMarkerImage",{
                mapIconColor:mapIconColor,
                callBack:function(result){
                    this.set("loadingText","");
                    this.send("loadMap");
                }.switchScope(this)
            });
        },
        loadMapIconColor:function(expId){
            var markerIconController = this.get("controllers.marker_icon");
            markerIconController.send("fetchMarkerIconColor",{
                experiment:expId,
                callBackForSuc:function(result){
                    this.set("loadingText","");
                    var color = result.get("map_icon_color");
                    this.set("mapIconColor",color);
                    this.send("loadMarkerImage",color);
                }.switchScope(this),
                callBackForFail:function(result){
                }.switchScope(this)
            });
        },
        loadData:function(){
            var sessionController = this.get("controllers.session");
            var unit = this.get("model.unit_id");
            var fetcher = MobileApp.LastDataByUnitFetcher.create({
                token:sessionController.genrateToken(),
                log_id:localStorage.getItem("log_id"),
                unit:unit
            });
            var promise = fetcher.tryPost();
            promise.then(function(result){
                var curServiceTime = result.get("cur_service_time").replace(/\//g,"-"),
                    rawData = result.get("raw_data"),
                    receiveTime = result.get("receive_time").replace(/\//g,"-");
                if(!this.checkTimeErr(receiveTime)){
                    return;
                };
                // reJson.rawData = decodeURIComponent(reJson.rawData);//先把rawData解码
                // reJson.rawData = HOJS.lib.parseHexsFromString(reJson.rawData);//把字符串转成16进制串
                if (rawData && rawData.length > 0) {
                    var hexItems = MobileApp.common.matchHexsByStartEnd(rawData);
                    var dataItems = [];
                    if(hexItems){
                        hexItems.forEach(function(hexItem){
                            var dataItem = {},
                                analyzeData = {};
                            analyzeData = MobileApp.common.convertToValuesFromHexs(hexItem,true);//解析数据
                            if(this.checkForErrDot(analyzeData)){
                                // dataItem = $.extend(analyzeData,reJson);
                                dataItem = $.extend(analyzeData,{
                                    "curServiceTime":curServiceTime,
                                    "receiveTime":receiveTime
                                });
                                dataItems.push(dataItem);
                            }
                            else{
                                this.set("mapTipText","最新数据无效！");
                            }
                        }.switchScope(this));
                        if(dataItems.length > 0){
                            this.set("preDatas",this.get("lastDatas"));
                            this.set("lastDatas",dataItems);
                            this.showDataItem();
                        }
                    }
                    else{
                        console.warn("出现START-END匹配不全的数据！");
                    }
                }
            }.switchScope(this),function(reason){
            }.switchScope(this));
        },
        startTrace:function(){
            this.set("isTraceStarted",true);
            clearTimeout(this.get("timerForStartTrace"));
            this.send("loadData");
            this.set("timerForStartTrace",setTimeout(function () { 
                this.send("startTrace"); 
            }.switchScope(this), this.get("dataRefreshRate")));
        }
    }
});

