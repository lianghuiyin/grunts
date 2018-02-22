/****
google maps api for horizon
author:alex
****/
(function($) {
    USGSOverlay.prototype = new google.maps.OverlayView();
    var settings = null;
    function getMarkerUrlByColorFun(markerColor){
        var markersPath = "images/markers";
        // "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|%@".fmt(markerColor)
        return "%@/chart_%@.png".fmt(markersPath, markerColor.toUpperCase());
    }
    $.fn.easyGoogleMap = function(options) {
        if (typeof(options) == 'undefined') options = {};
        //        var settings = defaultSettings();
        settings = defaultSettings();
        $.extend(settings, {
            map: null,
            marker: null,
            infowindow: null,
            tipMarker: null,
            tipInfoWindow: null
        });
        if (options) {
            $.extend(settings, options);
        };
        ini(settings, $(this));
        return this;
    };
    //默认参数设置
    var defaultSettings = function() {
        return {
            mapLoaded: false,
            mapLoadedFun: function() {},
            //            latLng: { lat: 32.130100, lng: 112.202735 },
            latLng: {
                lat: 35.86166,
                lng: 104.19539699999996
            },
            zoom: 3,
            //            zoom: 15,
            markerTitle: "",
            polylines: [], //all google.maps.Polyline from polylineArray
            markers: [], //all google.maps.Marker from markersArray
            overlays: [], //all google.maps.OverlayView()
            rectangles: [], //all google.maps.Rectangle()
            circles: [], //all google.maps.Circles()
            customArrayMapObj: {}
        }
    };

    function ini(settings, obj) {
        var myLatLng = new google.maps.LatLng(settings.latLng.lat, settings.latLng.lng);
        var myOptions = {
            zoom: settings.zoom,
            center: myLatLng,
            mapTypeId: google.maps.MapTypeId.HYBRID
            // mapTypeId: google.maps.MapTypeId.SATELLITE
            //            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
        settings.map = new google.maps.Map(obj[0], myOptions);

        google.maps.event.addListener(settings.map, 'tilesloaded', function() {
            settings.mapLoaded = true;
            settings.mapLoadedFun();
        });
        //        google.maps.event.addListener(settings.map, 'bounds_changed', function () {
        //            $(".alarmBox").html("bounds_changed");
        //        });
    };

    function USGSOverlay(latLng, callBack) {
        this.latLng = latLng;
        this.callBack = callBack;
        this.container = null;
        this.setMap(settings.map);
    }

    USGSOverlay.prototype.onAdd = function() {
        var div = document.createElement('DIV');
        $(div).css("position", "absolute");
        this.container = div;

        var panes = this.getPanes();
        panes.overlayImage.appendChild(this.container);
    }

    USGSOverlay.prototype.draw = function() {
        var overlayProjection = this.getProjection();
        var overlayPoint = overlayProjection.fromLatLngToDivPixel(new google.maps.LatLng(this.latLng.lat, this.latLng.lng));
        this.container.style.left = overlayPoint.x + 'px';
        this.container.style.top = overlayPoint.y + 'px';
        this.callBack(this.container);
    }

    USGSOverlay.prototype.onRemove = function() {
        this.container.parentNode.removeChild(this.container);
    }

    // Note that the visibility property must be a string enclosed in quotes
    USGSOverlay.prototype.hide = function() {
        if (this.container) {
            this.container.style.visibility = "hidden";
        }
    }

    USGSOverlay.prototype.show = function() {
        if (this.container) {
            this.container.style.visibility = "visible";
        }
    }

    USGSOverlay.prototype.toggle = function() {
        if (this.container) {
            if (this.container.style.visibility == "hidden") {
                this.show();
            } else {
                this.hide();
            }
        }
    }

    USGSOverlay.prototype.toggleDOM = function() {
        if (this.getMap()) {
            this.setMap(null);
        } else {
            this.setMap(settings.map);
        }
    }

    $.fn.getCenter = function() {
        return settings.map.getCenter();
    };
    $.fn.getZoom = function() {
        return settings.map.getZoom();
    };
    $.fn.setMarker = function(latLng, markerColor) {
        if (settings.marker != undefined && settings.marker != null) {
            settings.marker.setMap(null);
            settings.marker = null;
        }
        var pinColor = markerColor ? markerColor : "FE7569";
        var pinImage = new google.maps.MarkerImage(getMarkerUrlByColorFun(pinColor),
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34));
        var pinShadow = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_shadow",
            new google.maps.Size(40, 37),
            new google.maps.Point(0, 0),
            new google.maps.Point(12, 35));
        settings.marker = new google.maps.Marker({
            position: new google.maps.LatLng(latLng.lat, latLng.lng),
            title: settings.markerTitle,
            map: settings.map,
            icon: pinImage,
            shadow: pinShadow
        });
        settings.marker.setMap(settings.map);
    }
    $.fn.setCenter = function(latLng) {
        settings.map.setCenter(new google.maps.LatLng(latLng.lat, latLng.lng));
    }
    $.fn.panTo = function(latLng) {
        settings.map.panTo(new google.maps.LatLng(latLng.lat, latLng.lng));
    }
    $.fn.panToBounds = function(latLngSw, latLngNe) {
        settings.map.panToBounds(new google.maps.LatLngBounds(new google.maps.LatLng(latLngSw.lat, latLngSw.lng), new google.maps.LatLng(latLngNe.lat, latLngNe.lng)));
    }
    $.fn.addMarker = function(latLng) {
        var newMarker = new google.maps.Marker({
            position: new google.maps.LatLng(latLng.lat, latLng.lng),
            title: settings.markerTitle,
            map: settings.map
        });
        settings.markers.push(newMarker);
    }
    $.fn.setInfo = function(content) {
        if (settings.infowindow != undefined && settings.infowindow != null) {
            settings.infowindow = null;
        }
        if (settings.marker != undefined && settings.marker != null) {
            settings.infowindow = new google.maps.InfoWindow({
                content: content
            });
            settings.infowindow.open(settings.map, settings.marker);
        }
    }
    $.fn.setTipInfo = function(content, latLng) {
        if (settings.tipInfowindow != undefined && settings.tipInfowindow != null) {
            settings.tipInfowindow.close();
            settings.tipInfowindow = null;
        }
        if (settings.tipMarker != undefined && settings.tipMarker != null) {
            settings.tipMarker = null;
        }
        settings.tipInfowindow = new google.maps.InfoWindow({
            content: content
        });
        settings.tipMarker = new google.maps.Marker({
            position: new google.maps.LatLng(latLng.lat, latLng.lng)
        });
        setTimeout(function() {
            settings.tipInfowindow.open(settings.map, settings.tipMarker);
        }, 0);

    }
    $.fn.removeTipInfo = function() {
        if (settings.tipInfowindow != undefined && settings.tipInfowindow != null) {
            setTimeout(function() {
                settings.tipInfowindow.close();
                //                settings.tipInfowindow = null;
                //                settings.tipMarker = null;
            }, 0);
        }
    }
    $.fn.drawLines = function(latLngs, lineOptions, customArrayMapObjName,isNotNeedToClearOld) {
        var flightPlanCoordinates = [];
        for (var i = 0,len = latLngs.length;i < len;i++) {
            flightPlanCoordinates.push(new google.maps.LatLng(latLngs[i].lat, latLngs[i].lng));
        }
        if(!isNotNeedToClearOld){
            $.fn.clearAllPolylines();
        }
        var options = {
            clickable: true,
            path: flightPlanCoordinates,
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2
        };
        $.extend(options, lineOptions);
        var flightPath = new google.maps.Polyline(options);
        // google.maps.event.addListener(flightPath, 'click', function() {
        // });
        flightPath.setMap(settings.map);
        if (customArrayMapObjName) {
            settings.customArrayMapObj[customArrayMapObjName].push(flightPath);
        } else {
            settings.polylines.push(flightPath);
        }
    }
    $.fn.drawAloneLine = function(latLng1, latLng2, index, clickFun, strColor) {
        if (strColor == undefined || strColor == null || strColor == "") {
            strColor = "#FF0000";
        }
        var flightPlanCoordinates = [
            new google.maps.LatLng(latLng1.lat, latLng1.lng),
            new google.maps.LatLng(latLng2.lat, latLng2.lng)
        ];
        var flightPath = new google.maps.Polyline({
            clickable: false,
            path: flightPlanCoordinates,
            strokeColor: strColor,
            strokeOpacity: 1.0,
            strokeWeight: 3
        });
        if (clickFun != undefined && clickFun != null && index != undefined && index > 0) {
            flightPath.clickable = true;
            google.maps.event.addListener(flightPath, 'click', function() {
                clickFun(index);
            });
        }
        flightPath.setMap(settings.map);
        settings.polylines.push(flightPath);
    }
    $.fn.getAloneLinesLatLngs = function(isNeedToMarkBreak) {
        var reLatLngs = [],polylines = settings.polylines,
        tempLatLng = null,tempPreLatLng = null,tempPreLastLatLng = null,tempPrePath = null,
        isBreaked = false,isNotRepeat = true;
        $(polylines).each(function(i, n) {
            tempLatLng = n.getPath().getAt(1);
            if(i > 0){
                tempPrePath = polylines[i - 1].getPath();
                tempPreLatLng = tempPrePath.getAt(1);//getAt索引是倒着的，即第一个点索引是最大的，这里是1，而不是0
                if(tempPreLatLng.lat() != tempLatLng.lat() || tempPreLatLng.lng() != tempLatLng.lng()){
                    isNotRepeat = true;
                }
                else{
                    isNotRepeat = false;
                }
                if(isNeedToMarkBreak && i > 0){
                    tempPreLastLatLng = tempPrePath.getAt(0);
                    if(tempPreLastLatLng.lat() != tempLatLng.lat() || tempPreLastLatLng.lng() != tempLatLng.lng()){
                        isBreaked = true;
                    }
                    else{
                        isBreaked = false;
                    }
                }
                else{
                    isBreaked = false;
                }
            }
            if(isNotRepeat){
                if(isBreaked){
                    reLatLngs.push({
                        lat: tempLatLng.lat(),
                        lng: tempLatLng.lng(),
                        isBreaked:1
                    });
                    console.log("isBreaked:" + i);
                }
                else{
                    reLatLngs.push({
                        lat: tempLatLng.lat(),
                        lng: tempLatLng.lng()
                    });
                }
            }
        });
        return reLatLngs;
    }
    $.fn.removeLastAloneLines = function(lengthForRemove) {
        var curLength = settings.polylines.length;
        if (curLength - lengthForRemove >= 0) {
            for (var i = curLength - 1; i >= curLength - lengthForRemove; i--) {
                settings.polylines[i].setMap(null);
                settings.polylines[i] = null;
            }
            settings.polylines.length = curLength - lengthForRemove;
        }
    }
    $.fn.getAloneLinesLength = function() {
        return settings.polylines.length;
    }
    $.fn.getAloneLines = function() {
        return settings.polylines;
    }
    $.fn.clearAllPolylines = function(isNeedToClearCircle) {
        for (var i = 0; i < settings.polylines.length; i++) {
            settings.polylines[i].setMap(null);
            if (isNeedToClearCircle) {
                //isNeedToClearCircle是否清除同心圆(报警)
                var tempLagLng = settings.polylines[i].getPath().getAt(0);
                $(settings.circles).each(function(i, n) {
                    if (n.getCenter().equals(tempLagLng)) {
                        n.setMap(null);
                        n = null;
                    }
                });
            }
        }
        settings.polylines.length = 0;
    }
    $.fn.clearPolylinesForLength = function(length) {
        var countForShift = settings.polylines.length - length;
        if (countForShift > 0) {
            for (var i = 0; i < countForShift; i++) {
                settings.polylines.shift().setMap(null);
            }
        }
    }
    $.fn.clearCirclesForLength = function(length) {
        var countForShift = settings.circles.length - length;
        if (countForShift > 0) {
            for (var i = 0; i < countForShift; i++) {
                settings.circles.shift().setMap(null);
            }
        }
    }
    $.fn.setMarkers = function(dataJson) {
        $(dataJson).each(function(i, n) {
            var title = "";
            if (n.title != undefined && n.title != null) {
                title = n.title;
            } else {
                title = settings.markerTitle;
            }
            var mapIconColor = n.mapIconColor;
            var pinColor = mapIconColor ? mapIconColor : "FE7569";
            var pinImage = new google.maps.MarkerImage(getMarkerUrlByColorFun(pinColor),
                new google.maps.Size(21, 34),
                new google.maps.Point(0, 0),
                new google.maps.Point(10, 34));
            var pinShadow = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_shadow",
                new google.maps.Size(40, 37),
                new google.maps.Point(0, 0),
                new google.maps.Point(12, 35));
            var tempMarker = new google.maps.Marker({
                position: new google.maps.LatLng(n.latLng.lat, n.latLng.lng),
                title: title,
                map: settings.map,
                icon: pinImage,
                shadow: pinShadow
            });
            tempMarker.setMap(settings.map);
            if (n.clickFun != undefined && n.clickFun != null) {
                google.maps.event.addListener(tempMarker, 'click', function() {
                    n.clickFun();
                });
            }
            settings.markers.push(tempMarker);
        });
    }
    $.fn.clearAllMarkers = function() {
        for (var i = 0; i < settings.markers.length; i++) {
            settings.markers[i].setMap(null);
        }
        settings.markers.length = 0;
    }
    $.fn.clearMarkersForLength = function(length) {
        var countForShift = settings.markers.length - length;
        if (countForShift > 0) {
            for (var i = 0; i < countForShift; i++) {
                settings.markers.shift().setMap(null);
            }
        }
    }
    $.fn.setOverlays = function(dataJson) {
        //dataJson:{latLng:{lat:-,lng:-},callBack:function(){}}
        $(dataJson).each(function(i, n) {
            var tempOverlay = new USGSOverlay(n.latLng, n.callBack);
            settings.overlays.push(tempOverlay);
        });
    }
    $.fn.clearAllOverlays = function() {
        for (var i = 0; i < settings.overlays.length; i++) {
            settings.overlays[i].setMap(null);
        }
        settings.overlays.length = 0;
    }
    $.fn.clearOverlaysForLength = function(length) {
        var countForShift = settings.overlays.length - length;
        if (countForShift > 0) {
            for (var i = 0; i < countForShift; i++) {
                settings.overlays.shift().setMap(null);
            }
        }
    }
    $.fn.setMapByAddress = function(strAddr) {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            'address': strAddr
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                settings.map.setCenter(results[0].geometry.location);
            } else {
                alert("地址请求失败！");
            }
        });
    }
    $.fn.isMapLoaded = function() {
        return settings.mapLoaded;
    }
    $.fn.addRectangle = function(options) {
        /*
        rectangleOptions为api中rectangle类的Options设置，其大致结构如下：
        {
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
        clickable: false,
        bounds: null,
        editable: false，
        zIndex：1
        };
        rectangleLatLngs结构：
        {
        beginLatLng：
        {
        lat:...,
        lng:...
        },
        endLatLng:
        {
        lat:...,
        lng:...
        }
        };
        */
        var parasSettings = {
            rectangleLatLngs: null,
            callBackSucFun: null,
            rectangleOptions: null,
            mouseoverFun: null,
            mouseoutFun: null,
            clickFun: null
        };
        if (options) {
            $.extend(parasSettings, options);
        };
        var tempRectangle = new google.maps.Rectangle();
        var tempBounds = null;
        var rectangleSettings = {
            editable: false
        };
        if (parasSettings.rectangleOptions) {
            $.extend(rectangleSettings, parasSettings.rectangleOptions);
        };
        tempBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(parasSettings.rectangleLatLngs.beginLatLng.lat, parasSettings.rectangleLatLngs.beginLatLng.lng),
            new google.maps.LatLng(parasSettings.rectangleLatLngs.endLatLng.lat, parasSettings.rectangleLatLngs.endLatLng.lng)
        );
        tempRectangle.setOptions(rectangleSettings);
        tempRectangle.setBounds(tempBounds);
        tempRectangle.setMap(settings.map);

        if (parasSettings.mouseoverFun != undefined && parasSettings.mouseoverFun != null && parasSettings.mouseoverFun != "") {
            google.maps.event.addListener(tempRectangle, 'mouseover', function(e) {
                parasSettings.mouseoverFun({
                    mouseLatLng: {
                        lat: e.latLng.lat(),
                        lng: e.latLng.lng()
                    },
                    index: $.inArray(this, settings.rectangles),
                    editable: this.getEditable()
                });
            });
        }
        if (parasSettings.mouseoutFun != undefined && parasSettings.mouseoutFun != null && parasSettings.mouseoutFun != "") {
            google.maps.event.addListener(tempRectangle, 'mouseout', function(e) {
                parasSettings.mouseoutFun();
            });
        }
        if (parasSettings.clickFun != undefined && parasSettings.clickFun != null && parasSettings.clickFun != "") {
            google.maps.event.addListener(tempRectangle, 'click', function(e) {
                parasSettings.clickFun({
                    mouseLatLng: {
                        lat: e.latLng.lat(),
                        lng: e.latLng.lng()
                    },
                    index: $.inArray(this, settings.rectangles),
                    editable: this.getEditable()
                });
            });
        }

        settings.rectangles.push(tempRectangle);

        if (parasSettings.callBackSucFun != undefined && parasSettings.callBackSucFun != null && parasSettings.callBackSucFun != "") {
            parasSettings.callBackSucFun();
        }

        tempRectangle = null;
        tempBounds = null;

    }
    $.fn.clearAllRectangles = function() {
        $(settings.rectangles).each(function(i, n) {
            n.setMap(null);
            n = null;
        });
        settings.rectangles.length = 0;
    }
    $.fn.delRectangles = function(index) {
        settings.rectangles[index].setMap(null);
        settings.rectangles[index] = null;
        settings.rectangles.splice(index, 1);
    }
    $.fn.getRectangleLatLngs = function(index) {
        var bounds = settings.rectangles[index].getBounds();
        var southWestLatLngs = bounds.getSouthWest();
        var northEastLatLngs = bounds.getNorthEast();
        var reJson = {
            beginLatLng: {
                lat: southWestLatLngs.lat(),
                lng: southWestLatLngs.lng()
            },
            endLatLng: {
                lat: northEastLatLngs.lat(),
                lng: northEastLatLngs.lng()
            }
        };
        return reJson;
    }
    $.fn.getAllRectangleLatLngs = function() {
        var reArr = [];
        $(settings.rectangles).each(function(i, n) {
            reArr.push($.fn.getRectangleLatLngs(i));
        });
        return reArr;
    }
    $.fn.setRectangleEditable = function(index) {
        settings.rectangles[index].setOptions({
            editable: true
        });
    }
    $.fn.setRectangleUnEditable = function(index) {
        settings.rectangles[index].setOptions({
            editable: false
        });
    }
    $.fn.setAllRectangleEditable = function() {
        $(settings.rectangles).each(function(i, n) {
            n.setOptions({
                editable: true
            });
        });
    }
    $.fn.setAllRectangleUnEditable = function() {
        $(settings.rectangles).each(function(i, n) {
            n.setOptions({
                editable: false
            });
        });
    }
    $.fn.showAllRectangle = function() {
        $(settings.rectangles).each(function(i, n) {
            n.setMap(settings.map);
        });
    }
    $.fn.hideAllRectangle = function() {
        $(settings.rectangles).each(function(i, n) {
            n.setMap(null);
        });
    }
    $.fn.applyCustomArrayMapObj = function(name) {
        settings.customArrayMapObj[name] = [];
    }
    $.fn.getCustomArrayMapObj = function(name) {
        return settings.customArrayMapObj[name];
    }
    $.fn.clearCustomArrayMapObj = function(name) {
        $(settings.customArrayMapObj[name]).each(function(i, n) {
            n.setMap(null);
            n = null;
        });
        settings.customArrayMapObj[name].length = 0;
    }
    $.fn.showAllCustomArrayMapObj = function(name) {
        $(settings.customArrayMapObj[name]).each(function(i, n) {
            n.setMap(settings.map);
        });
    }
    $.fn.hideAllCustomArrayMapObj = function(name) {
        $(settings.customArrayMapObj[name]).each(function(i, n) {
            n.setMap(null);
        });
    }
    $.fn.checkLatLngInAares = function(latLng, customArrayMapObjName, distance) {
        var boolRe = false;
        var tempLatLng = new google.maps.LatLng(latLng.lat, latLng.lng);
        var tempCircle = new google.maps.Circle({
            center: tempLatLng,
            radius: distance / 2
        });
        //        tempCircle.setMap(settings.map);
        var tempBounds = tempCircle.getBounds();
        var lines = settings.customArrayMapObj[customArrayMapObjName],paths;
        for(var j = 0,jLen = lines.length;j < jLen;j++){
            paths = lines[j].getPath();
            for (var i = 0; i < paths.length; i++) {
                var curLatLng = paths.getAt(i);
                if (tempBounds.contains(curLatLng)) {
                    boolRe = true;
                    break;
                }
            }
            if(boolRe){
                break;
            }
        }
        return boolRe;
    }
    $.fn.drawAloneCircle = function(latLng, distance, circleOptions) {
        var tempLatLng = new google.maps.LatLng(latLng.lat, latLng.lng);
        var tempCircle = new google.maps.Circle({
            center: tempLatLng,
            radius: distance / 2
        });
        //        circleOptions:
        //        {
        //            fillColor:..,
        //            fillOpacity:..,
        //            strokeColor:..,
        //            strokeOpacity:..,
        //            strokeWeight:..,
        //            zIndex:..,
        //        }
        if (circleOptions) {
            tempCircle.setOptions(circleOptions);
        }
        tempCircle.setMap(settings.map);

        settings.circles.push(tempCircle);
    }
    $.fn.clearAllCircles = function() {
        $(settings.circles).each(function(i, n) {
            n.setMap(null);
            n = null;
        });
        settings.circles.length = 0;
    }
    $.fn.getIndexOfLatLngInRectangles = function(latLng) {
        var reIndex = -1;
        var tempLatLng = new google.maps.LatLng(latLng.lat, latLng.lng);
        var tempBounds = null;
        for (var i = 0; i < settings.rectangles.length; i++) {
            tempBounds = settings.rectangles[i].getBounds();
            if (tempBounds.contains(tempLatLng)) {
                reIndex = i;
                break;
            }
        }
        tempBounds = null;
        return reIndex;
    }
})(jQuery);