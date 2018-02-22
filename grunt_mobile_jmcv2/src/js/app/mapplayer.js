MobileApp.UnitplayPlaytimerMapplayerRoute = Ember.Route.extend({
    controllerName: 'mapplayer',
    renderTemplate: function(controller) {
        this.render('mapplayer', {into:'unitplay',outlet: 'mapplayer',controller: controller});
    },
    beforeModel: function(transition) {
    },
    model:function(params, transition){
        return MobileApp.Mapplayer.create();
    },
    setupController: function(controller, model) {
        this._super(controller, model);
        var playtimerController = controller.get("controllers.unitplay_playtimer");
        model.set("unit_id",playtimerController.get("experiment.unit_id"));
        model.set("exp_id",playtimerController.get("experiment.exp_id"));
        model.set("car_no",playtimerController.get("experiment.car_no"));
        var placeId = playtimerController.get("experiment.pla_id");
        var placesController = controller.get("controllers.places");
        var place = placesController.getById(placeId);
        model.set("place_lat",place.get("lat"));
        model.set("place_lng",place.get("lng"));
        model.set("place_zoom",place.get("zoom"));
        model.set("start_time",playtimerController.get("start_time"));
        model.set("end_time",playtimerController.get("end_time"));
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
        var controller = this.controllerFor("mapplayer");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            MobileApp.transitionAnimation = "slideHorizontal";
            this.transitionTo('unitplay.playtimer');
        },
        togglePlay:function(){
            var controller = this.get("controller");
            controller.send("togglePlay");
        },
        backward:function(){
            var controller = this.get("controller");
            controller.send("backward");
        },
        forward:function(){
            var controller = this.get("controller");
            controller.send("forward");
        },
        clear:function(){
            var controller = this.get("controller");
            controller.send("clear");
        },
        openSetting:function(){
            var controller = this.get("controller");
            controller.send("openSetting");
        }
    }
});
MobileApp.Mapplayer = MobileApp.Model.extend({
    members:["unit_id","car_no","place_lat","place_lng","place_zoom","index","timeSpace"],
    action:"mapplayer",
    unit_id: null,
    exp_id:null,
    car_no:null,
    place_lat:null,
    place_lng:null,
    place_zoom:null,
    start_time:"",
    end_time:"",
    dataLength:0,
    index:0,
    timeSpace:0.1,
    settingIndex:0,
    settingIndexBinding: Ember.Binding.oneWay("index"),
    settingIndexDidChange:function(){
        var dataLength = this.get("dataLength"),
            idx = this.get("settingIndex");
        if(idx > dataLength - 1){
            this.get('errors').add('settingIndex', '不能超出数据最大帧数%@'.fmt(dataLength-1));
        }
        else{
            this.get('errors').remove('settingIndex');
            this.set("index",idx);
        }
    }.observes("settingIndex")
});

MobileApp.ExpDataByUnitAndTimeFetcher = MobileApp.Model.extend({
    members:["token","log_id","unit","start_time","end_time","page_size","cur_page"],
    action:"fetch_exp_data_by_unit_and_time",
    token: "",
    log_id:"",
    unit: "",
    start_time:"",
    end_time:"",
    page_size:2000,
    cur_page:0
});

MobileApp.MapplayerView = Ember.View.extend({
    classNames:['unitplay-playtimer-mapplayer','navigable-pane','collapse','h100per']
});

MobileApp.MapplayerController = Ember.ObjectController.extend({
    needs:["session","unitplay_playtimer","places","map_offset","marker_icon","google_script"],
    mapCanvas:null,
    mapTipText:"",
    loadingText:"",
    isMapLoading:false,
    enableMapOffset:true,
    hasGetMapOffset:false,
    hasTriggerMapOffset: false,
    mapOffset: { offsetLngX: 0, offsetLatY: 0 },
    timerForMapOffset:null,
    timerForPlay:null,
    hasStartPlay:false,
    autoPlay:false,
    playEnable:false,
    dataLoadComplete:false,
    isNeedToFilterErrDots:true,
    isNeedToStopDownload:false,
    isPlaying:false,
    needToSetCenter:true,
    needLineEvent: false,
    autoClear:true,
    infoMode:"fix",//follow/fix/none
    traceMode:"line",//line、point、none
    mapIconColor:"FE7569",//实验id对应的实验类型下的地图图标颜色
    arrayExpData:[],
    boolForwardLastIndex:false,
    maxLineLength: 10,
    dataLossTimeDiff: 20, //数据丢失时间长度定义（单位为秒），定义多少时间没收到数据为数据丢失状态，如果大于0则表示数据丢失时不连线。
    isAlarmPositionEnable:false,
    isAlarmSpeedsEnable:false,
    syncSpeed:"",
    syncReceiveTime:"",
    syncGpsTime:"",
    isNeedToShowInfo:true,
    isSetting:false,
    isInfoFix:function(){
        if(this.get("isSetting")){
            return false;
        }
        if(this.get("hasStartPlay")){
            if(this.get("isNeedToShowInfo")){
                return this.get("infoMode") == "fix";
            }
            else{
                return false;
            }
        }
        else{
            return false;
        }
    }.property("infoMode","isNeedToShowInfo","hasStartPlay","isSetting"),
    isTraceLine:Ember.computed.equal('traceMode', 'line'),
    isTraceNone:Ember.computed.equal('traceMode', 'none'),
    setMapOffset:function(){
        var arrayExpData = this.get("arrayExpData"),
            curIndex = this.get("index");
        if(arrayExpData.length == 0){
            return;
        }
        var mapOffsetController = this.get("controllers.map_offset");
        mapOffsetController.send("fetch",{
            lat:arrayExpData[curIndex].lat,
            lng:arrayExpData[curIndex].lng,
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
    },
    resetMapOffset:function(){
        clearTimeout(this.get("timerForMapOffset"));
        this.set("timerForMapOffset",setTimeout(function () { 
            this.setMapOffset(); 
        }.switchScope(this), 12000));
    },
    initMap:function(){
        this.get("controllers.unitplay_playtimer").set("isTimespanOut",false);//把时间设置界面的超时警告恢复
        this.set("isNeedToStopDownload",false);//上一次离开可以留下了true值，所以每次进来都要先重置为false

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
        //离开时要重置所有参数值
        clearTimeout(this.get("timerForMapOffset"));
        $("#map_canvas").remove();
        this.set("mapCanvas",null);
        this.set("mapTipText","");
        this.set("loadingText","");
        this.set("isMapLoading",false);
        this.set("hasGetMapOffset",false);
        this.set("hasTriggerMapOffset",false);
        this.set("mapOffset",{ offsetLngX: 0, offsetLatY: 0 });
        this.set("hasStartPlay",false);
        this.set("playEnable",false);
        this.set("dataLoadComplete",false);
        this.set("isNeedToStopDownload",true);//这个值不是重置，而是通知下载程序中止下载
        this.set("isPlaying",false);
        this.set("mapIconColor","FE7569");
        this.set("index",0);
        this.set("arrayExpData",[]);
        this.set("dataLength",0);
        this.set("isSetting",false);
    },
    convertToGpsDataItems:function(dataItem){
        var page = this,
            reGpsDataItems = [],
            rawData = dataItem.RawData,
            receiveTime = dataItem.ReceiveTime;
        dataItem.receiveTime = receiveTime;
        delete dataItem.RawData;
        delete dataItem.ReceiveTime;
        // rawData = decodeURIComponent(rawData);//先把rawData解码
        // rawData = HOJS.lib.parseHexsFromString(rawData);//把字符串转成16进制串
        if(rawData.length > 0){
            var hexItems = MobileApp.common.matchHexsByStartEnd(rawData);
            if(hexItems){
                hexItems.forEach(function(hexItem){
                    var reGpsDataItem = {},
                        analyzeData = {};
                    analyzeData = MobileApp.common.convertToValuesFromHexs(hexItem,false);//解析数据
                    if(analyzeData && analyzeData.lat && analyzeData.lng){
                        reGpsDataItem = $.extend(analyzeData,dataItem);
                        reGpsDataItems.push(reGpsDataItem);
                    }
                });
            }
            else{
                console.warn("出现START-END匹配不全的数据！");
            }
        }
        return reGpsDataItems;
    },
    download:function(params){
        if(this.get("isNeedToStopDownload")){
            console.log(111111);
            this.set("isNeedToStopDownload",false);
            return;
        }
        var sessionController = this.get("controllers.session");
        var fetcher = MobileApp.ExpDataByUnitAndTimeFetcher.create({
            token:sessionController.genrateToken(),
            log_id:localStorage.getItem("log_id"),
            unit:params.unitId,
            start_time:params.startTime,
            end_time:params.endTime,
            page_size:params.pageSize,
            cur_page:params.curPage
        });
        var promise = fetcher.tryPost();
        promise.then(function(result){
            var dataList = result.get("data_list"),
                totalRecord = result.get("total_record"),
                pageSize = params.pageSize,
                curPage = params.curPage;
            var arrayExpData = this.get("arrayExpData");
            $(dataList).each(function(i,n){
                var afterConverts = this.convertToGpsDataItems(n);
                if(afterConverts.length){
                    arrayExpData = arrayExpData.concat(afterConverts);   
                }
            }.switchScope(this));
            this.set("dataLength",arrayExpData.length);
            this.set("arrayExpData",arrayExpData);

            dataList = null;   
            result = null;                 

            if(curPage < Math.ceil(totalRecord/pageSize)){
                this.afterDownload(pageSize,curPage,totalRecord);
                //如果curPage不是最后一页，则继续生成下一页
                params.curPage++;
                setTimeout(function(){
                    this.download(params);
                }.switchScope(this),1000);
            }
            else{
                //反之就说明下载完成
                this.set("dataLoadComplete",true);
                if(this.get("isNeedToFilterErrDots")){
                    MobileApp.common.filterErrDots(arrayExpData);
                }
                this.set("dataLength",arrayExpData.length);
                this.afterDownload(pageSize,curPage,totalRecord);
            }
        }.switchScope(this),function(reason){
        }.switchScope(this));
    },
    afterDownload:function(pageSize,curPage,totalRecord){
        var dataLength = this.get("dataLength"),
            dataLoadComplete = this.get("dataLoadComplete"),
            enableMapOffset = this.get("enableMapOffset");
        if (dataLength == 0 && dataLoadComplete) {
            var loadingText = "选定范围内没有可以播放的有效数据...";
            this.set("mapTipText",loadingText);
            this.set("loadingText","");
        }
        else {
            if (dataLength == 0) {
                var loadingText = "数据下载中...还没有找到有效数据...%@/%@".fmt(pageSize*curPage,totalRecord);
                this.set("loadingText",loadingText);
            }
            else {
                if (dataLoadComplete) {
                    var loadingText = "数据下载完成...%@/%@".fmt(totalRecord,totalRecord);
                    this.set("loadingText",loadingText);
                    this.set("playEnable",true);
                    if (enableMapOffset) {
                        if (!this.get("hasTriggerMapOffset")) {
                            this.set("hasTriggerMapOffset",true);
                            this.setMapOffset();
                        }
                    }
                    this.send("loadMap");
                }
                else {
                    var loadingText = "数据持续下载中...%@/%@".fmt(pageSize*curPage,totalRecord);
                    this.set("loadingText",loadingText);
                }
            }
        }
    },
    checkReady:function(){
        var isReady = false,
            errMsg = "";
        var mapCanvas = this.get("mapCanvas");
        if(!this.get("dataLoadComplete") || this.get("dataLength") == 0){
            errMsg = "数据下载中，请稍后再操作！";
        }
        else if(!mapCanvas){
            errMsg = "地图加载中，请稍后再操作！";
        }
        else if(mapCanvas && !mapCanvas.isMapLoaded()){
            errMsg = "地图加载中，请稍后再操作！";
        }
        else if(!this.get("hasGetMapOffset")){
            errMsg = "地图加载中，请稍后再操作！";
        }
        else {
            isReady = true;
        }
        if(errMsg.length > 0){
            this.set("mapTipText", errMsg);
            setTimeout(function(){
                this.set("mapTipText", "");
            }.switchScope(this),3000);
        }
        return isReady;
    },
    pauseMapMarker:function(){
        clearTimeout(this.get("timerForPlay"));
        this.set("timerForPlay",null);
    },
    playMapMarker:function(){
        var index = this.get("index"),
            dataLength = this.get("dataLength"),
            timeSpace = this.get("timeSpace");
        if (index >= 0 && index < dataLength - 1) {
            this.set("index",++index);
            this.setMapMarker();
        }
        if (index < dataLength - 1) {
            this.set("timerForPlay",setTimeout(function () { 
                this.playMapMarker(); 
            }.switchScope(this), timeSpace * 1000));
        }
        else {
            this.pauseMapMarker();
            if (this.get("dataLoadComplete")) {
                this.set("boolForwardLastIndex",true);
                this.resetPlayer();
            }
        }
    },
    resetPlayer:function(){
        this.set("isPlaying",false);
    },
    checkDataLoss:function() {
        var index = this.get("index"),
            arrayExpData = this.get("arrayExpData"),
            dataLossTimeDiff = this.get("dataLossTimeDiff");
        if (index > 0) {
            return MobileApp.common.checkDataLossByTime(arrayExpData[index - 1].gpsTime, arrayExpData[index].gpsTime,dataLossTimeDiff);
        }
        else {
            return true;
        }
    },
    gotoIndex:function(idx) {
        this.set("index",idx);
        var tempPlayMode = this.get("traceMode");
        this.set("traceMode","none");
        this.setMapMarker();
        this.set("traceMode",tempPlayMode);
    },
    setMapMarker:function(){
        var index = this.get("index"),
            arrayExpData = this.get("arrayExpData"),
            mapOffset = this.get("mapOffset"),
            mapCanvas = this.get("mapCanvas"),
            mapIconColor = this.get("mapIconColor"),
            needToSetCenter = this.get("needToSetCenter"),
            infoMode = this.get("infoMode"),
            traceMode = this.get("traceMode"),
            needLineEvent = this.get("needLineEvent"),
            timerForPlay = this.get("timerForPlay"),
            autoClear = this.get("autoClear"),
            maxLineLength = this.get("maxLineLength"),
            isAlarmPositionEnable = this.get("isAlarmPositionEnable"),
            isAlarmSpeedsEnable = this.get("isAlarmSpeedsEnable");
        var item = arrayExpData[index];

        var tempLatLng = {
            lat: item.lat + mapOffset.offsetLatY,
            lng: item.lng + mapOffset.offsetLngX
        };
        mapCanvas.setMarker(tempLatLng,mapIconColor);

        if (index > 0) {
            if (needToSetCenter && infoMode != "follow") {
                mapCanvas.panTo({
                    lat: item.lat + mapOffset.offsetLatY,
                    lng: item.lng + mapOffset.offsetLngX
                });
            } else {
                mapCanvas.panToBounds({
                    lat: item.lat + mapOffset.offsetLatY,
                    lng: item.lng + mapOffset.offsetLngX
                }, {
                    lat: item.lat + mapOffset.offsetLatY,
                    lng: item.lng + mapOffset.offsetLngX
                });
            }
        } else {
            mapCanvas.panTo({
                lat: item.lat + mapOffset.offsetLatY,
                lng: item.lng + mapOffset.offsetLngX
            });
        }

        //判断报警，并在报警时突出显示
        var boolAlarmPosition = false,
            boolAlarmSpeeds = false;
        // if (settings.isAlarmPositionEnable) {
        //     boolAlarmPosition = !settings.mapCanvas.checkLatLngInAares(tempLatLng, settings.traceMapObjName, settings.traceWidth);
        //     if (boolAlarmPosition) {
        //         settings.mapCanvas.drawAloneCircle(tempLatLng, settings.traceWidth, { strokeColor: "yellow", fillColor: "yellow", zIndex: -60, strokeOpacity: 0.4, fillOpacity: 0.1, clickable: false });
        //     }
        // }

        // if (settings.isAlarmSpeedsEnable) {
        //     var indexInSpeedAreas = settings.mapCanvas.getIndexOfLatLngInRectangles(tempLatLng);
        //     if (indexInSpeedAreas >= 0) {
        //         var curSpeed = item.speed;
        //         boolAlarmSpeeds = curSpeed < settings.speedAreas[indexInSpeedAreas].speeds.minSpeed || curSpeed > settings.speedAreas[indexInSpeedAreas].speeds.maxSpeed;
        //         if (boolAlarmSpeeds) {
        //             settings.mapCanvas.drawAloneCircle(tempLatLng, settings.traceWidth, { strokeColor: "white", fillColor: "white", zIndex: -40, strokeOpacity: 0.6, fillOpacity: 0.1, clickable: false });
        //         }
        //     }
        // }

        var strInfo = "速度:%@<br/>接收时间:%@<br/>卫星时间:%@".fmt(item.speed, item.receiveTime, item.gpsTime);
        // var alarmInfo = "";
        // if (boolAlarmPosition) {
        //     alarmInfo += '<span class = "red">+位置报警</span>'
        // }
        // if (boolAlarmSpeeds) {
        //     alarmInfo += '<span class = "red">+速度报警</span>'
        // }
        // if(alarmInfo.length > 0){
        //     alarmInfo = "<div class = \"tc\">%@</div>".fmt(alarmInfo);
        // }
        // strInfo += alarmInfo;
        if (infoMode == "follow") {
            mapCanvas.setInfo(strInfo);
        } else if (infoMode == "fix") {
            this.set("syncSpeed",item.speed);
            this.set("syncGpsTime",item.gpsTime);
        }

        if (index > 0) {
            var isDataLoss = !this.checkDataLoss();
            if (traceMode == "line" && !isDataLoss) {
                if (needLineEvent) {
                    mapCanvas.drawAloneLine({
                            lat: arrayExpData[index].lat + mapOffset.offsetLatY,
                            lng: arrayExpData[index].lng + mapOffset.offsetLngX
                        }, {
                            lat: arrayExpData[index - 1].lat + mapOffset.offsetLatY,
                            lng: arrayExpData[index - 1].lng + mapOffset.offsetLngX
                        },
                        index,
                        function(idx) {
                            if (!timerForPlay) {
                                var tempNeedToSetCenter = needToSetCenter;
                                this.set("needToSetCenter",false);
                                this.gotoIndex(--idx);
                                this.set("needToSetCenter",tempNeedToSetCenter);
                            } else {
                                this.set("mapTipText","您必须先暂停播放，才能点击轨迹定位！");
                                setTimeout(function(){
                                    this.set("mapTipText","");
                                }.switchScope(this),3000);
                            }
                        }.switchScope(this)
                    );
                } else {
                    mapCanvas.drawAloneLine({
                        lat: arrayExpData[index].lat + mapOffset.offsetLatY,
                        lng: arrayExpData[index].lng + mapOffset.offsetLngX
                    }, {
                        lat: arrayExpData[index - 1].lat + mapOffset.offsetLatY,
                        lng: arrayExpData[index - 1].lng + mapOffset.offsetLngX
                    });
                }
                if (autoClear) {
                    mapCanvas.clearAllMarkers();
                    mapCanvas.clearPolylinesForLength(maxLineLength);
                    if(isAlarmPositionEnable || isAlarmSpeedsEnable){
                        mapCanvas.clearCirclesForLength(maxLineLength);
                    }
                }
            } else if (traceMode == "point") {
                mapCanvas.addMarker({
                    lat: arrayExpData[index - 1].lat + mapOffset.offsetLatY,
                    lng: arrayExpData[index - 1].lng + mapOffset.offsetLngX
                });
                if (autoClear) {
                    mapCanvas.clearAllPolylines();
                    mapCanvas.clearMarkersForLength(maxLineLength);
                    if(isAlarmPositionEnable || isAlarmSpeedsEnable){
                        mapCanvas.clearCirclesForLength(maxLineLength);
                    }
                }
            }
        }

    },
    actions:{
        navigablePush:function(){
            $(".unitplay-playtimer.navigable-pane").navigablePush({
                targetTo:".unitplay-playtimer-mapplayer.navigable-pane",
                animation:MobileApp.transitionAnimation,
                callBack:function(){
                    this.initMap();
                }.switchScope(this)
            });
            MobileApp.transitionAnimation = "none";
        },
        navigablePop:function(){
            this.unloadMap();
            $(".unitplay-playtimer-mapplayer.navigable-pane").navigablePop({
                targetTo:".unitplay-playtimer.navigable-pane",
                animation:MobileApp.transitionAnimation
            });
            MobileApp.transitionAnimation = "none";
        },
        loadMap:function(){
            var lat = this.get("place_lat"),
                lng = this.get("place_lng"),
                zoom = this.get("place_zoom");
            var mapCanvas = $("<div id = 'map_canvas'></div>");
            mapCanvas.appendTo(".unitplay-playtimer-mapplayer.navigable-pane");
            this.set("mapCanvas",mapCanvas);
            this.set("loadingText","地图加载中...");
            mapCanvas.easyGoogleMap({
                latLng: { lat: lat, lng: lng },
                zoom: zoom,
                markertitle: "Horizon整车试验地图回放",
                mapLoadedFun: function () {
                    this.set("loadingText","");
                    this.set("isMapLoading",false);
                    var enableMapOffset = this.get("enableMapOffset"),
                        dataLength = this.get("dataLength");
                    if (enableMapOffset && dataLength > 0) {
                        this.setMapOffset();
                    }
                    this.send("firstAutoPlay");
                }.switchScope(this)
            });
        },
        firstAutoPlay:function(){
            if (!this.get("hasStartPlay")) {
                //in first time loaded
                var mapCanvas = this.get("mapCanvas");
                if (this.get("autoPlay") && mapCanvas.isMapLoaded() && this.get("playEnable")) {
                    // page.settings.btnIconPlay.trigger("click");
                    // this.set("hasStartPlay",true);
                }
            }
        },
        loadMarkerImage:function(mapIconColor){
            this.set("loadingText","地图图标加载中...");
            var markerIconController = this.get("controllers.marker_icon");
            markerIconController.send("loadMarkerImage",{
                mapIconColor:mapIconColor,
                callBack:function(result){
                    this.set("loadingText","");
                    this.send("loadData");
                }.switchScope(this)
            });
        },
        loadData:function(){
            this.set("loadingText","数据下载中...");
            setTimeout(function(){
                var unitId = this.get("model.unit_id"),
                    startTime = this.get("model.start_time"),
                    endTime = this.get("model.end_time");
                this.download({
                    unitId:unitId,
                    startTime:startTime,
                    endTime:endTime,
                    totalRecord:0,
                    pageSize:2000,//分页下载每页下载多少条
                    curPage:1
                });
            }.switchScope(this),2000);
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
        togglePlay:function(){
            if (this.checkReady()) {
                if (this.get("boolForwardLastIndex")) {
                    this.set("index",0);
                }
                if (this.get("timerForPlay")) {
                    this.set("isPlaying",false);
                    this.pauseMapMarker();
                } else {
                    this.set("isPlaying",true);
                    this.set("hasStartPlay",true);
                    this.playMapMarker();
                }
                this.set("boolForwardLastIndex",false);
            }
        },
        backward:function(){
            if (this.checkReady()) {
                this.set("hasStartPlay",true);
                this.set("boolForwardLastIndex",false);
                var index = this.get("index");
                if (index > 0) {
                    this.set("index",--index);
                    if (this.get("timerForPlay")) {
                        this.pauseMapMarker();
                        this.playMapMarker();
                    }
                    else {
                        this.setMapMarker();
                    }
                }
            }
        },
        forward:function(){
            if (this.checkReady()) {
                this.set("hasStartPlay",true);
                var index = this.get("index"),
                    dataLength = this.get("dataLength"),
                    boolForwardLastIndex = this.get("boolForwardLastIndex"),
                    timerForPlay = this.get("timerForPlay");
                if (index < dataLength - 1) {
                    this.set("index",++index);
                    if (index == dataLength - 1) {
                        this.set("boolForwardLastIndex",true);
                    }
                    if (timerForPlay) {
                        this.pauseMapMarker();
                        this.playMapMarker();
                    }
                    else {
                        this.setMapMarker();
                    }
                }
            }
        },
        clear:function(){
            var mapCanvas = this.get("mapCanvas");
            mapCanvas.clearAllPolylines();
            mapCanvas.clearAllMarkers();
            mapCanvas.clearAllCircles();
        },
        openSetting:function(){
            this.set("isSetting",true);
        },
        closeSetting:function(){
            this.set("isSetting",false);
        },
        setTraceMode:function(value){
            if(value == "none"){
                this.send("clear");
            }
            this.set("traceMode",value);
        },
        setIsNeedToShowInfo:function(value){
            this.set("isNeedToShowInfo",value);
        }
    }
});

