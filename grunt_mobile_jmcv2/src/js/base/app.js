/*!
 * MobileApp v1.0
 * Copyright 2011-2014 Lit.In
 */

window.MobileApp = Ember.Application.create({
    LOG_TRANSITIONS: true,
    transitionAnimation:"none"
});

MobileApp.Router.reopen({
  location: 'none'
});

MobileApp.common = {
    /**
     * [checkDataLossByTime 校验数据时间跨度是否在丢失数据定义范围内]
     * @param  {[string]} firstTime        [第一条数据时间]
     * @param  {[string]} secondTime       [第二条数据时间]
     * @param  {[int]} dataLossTimeDiff    [时间跨度临界值，丢失数据定义范围，单位为秒]
     * @return {[boolean]}                 [是否通过校验，通过为true，反之为False]
     */
    checkDataLossByTime:function(firstTime,secondTime,dataLossTimeDiff){
        if (dataLossTimeDiff > 0) {
            var timeDiff = HOJS.lib.dateDiff('S', firstTime, secondTime);
            if (Math.abs(timeDiff) > dataLossTimeDiff) {
                console.warn("timeout");
                return false;
            }
            else {
                return true;
            }
        }
        else {
            return true;
        }
    },
    /**
     * [matchHexsByStartEnd 把16进制原始数据分隔成16进制串Start开头，16进制串End结尾的单条数据]
     * @param  {[type]} hexs [16进制原始数据，由若干组5354415254开头，454E44结尾的16进制串]
     * return {[array]} 配置后的数组
     */
    matchHexsByStartEnd:function(hexs){
        return hexs.toUpperCase().match(/(5354415254)[0-9a-zA-Z]+?(454E44)/g);
    },
    /**
     * [convertToValuesFromHexs description]
     * 把一条完整的16进制数据记录解析出来，并以json格式返回解析后的结果
     * 返回的结果包含"试验名/GPS时间/纬度/经度/速度/CAN或K数据通道信息"
     * 比如要解析的16进制串为：
     * 5354 4152 5407 7075 6d61 3830 3000 0000
     * 0000 0000 0000 0000 0000 0000 0000 0000
     * 0000 0000 0000 0000 0010 c5e5 ec00 1144
     * 0e80 0012 4520 a000 13c1 f000 0014 40a0
     * 0000 454e 44
     * 其解析过程为：
     * 5354 4152 54(START,占用5个字节)
     * 07 (7,试验名长度，即字节数，占用1个字节无符号整数)
     * 7075 6d61 3830 30(puma800,试验名，占用字节数取决于试验名长度)
     * 00 0000 0000 0000 00(GPS时间，占用8个字节，双精度浮点数据，单位为秒，可转换为日期时间值)
     * 00 0000 0000 0000 00(纬度，占用8个字节，双精度浮点数据，单位为度)
     * 00 0000 0000 0000 00(经度，占用8个字节，双精度浮点数据，单位为度)
     * 00 0000 00(速度，占用4个字节，单精度浮点数据，单位为km/h)
     * 10 c5e5 ec00 1144 0e80 0012 4520 a000 13c1 f000 0014 40a0 0000
     * (CAN或K数据通道名序号[每个1字节，无符号整形数]及CAN或K数据通道值[每个4字节，单精度浮点数]，
     * 最长为100个字节，每个通道占用5个字节，最多20个通道)
     * 454e 44(END,占用3个字节)
     * 后来规则变成了在START及试验名长度之前增加一个字节用于表示数据类型
     * AA表示为CAN+GPS类型，BB表示为K类型，CC表示为GPS类型
     * 其规则与之前类似，只是换成三种方式了，
     * 其中AA表示的CAN+GPS类型与之前基本一样，只是增加了数据类型
     * 而BB表示的K类型是在AA类型基础上把GPS那块去掉了
     * CC表示的GPS类型则相反，是在AA类型基础上把CAN那块去掉了
     * 且CAN与K数据都是通道数据,都是最长为100个字节，每个通道占用5个字节，最多20个通道
     * sourseTypeHexs为AA的案例
     * 5354415254AA0770756D6138303041E75B55B8C00000404715F487FCB924402E1B466C8446044183DCC601C1F00000024020A00003C1F0000004C1F0000005407AFB010641200000084230000009C2381EB80AC2381EB80BC2381EB80CC2381EB80A44A8A8000EC18000000FC180000010C5CFD60011455450001245A8A80013C1980000144128000015C58FD800454E44
     * sourseTypeHexs为BB的案例
     * 5354415254BB0770756D6138303001C1F00000024020A00003C1F0000004C1F0000005407AFB010641200000084230000009C2381EB80AC2381EB80BC2381EB80CC2381EB80A44A8A8000EC18000000FC180000010C5CFD60011455450001245A8A80013C1980000144128000015C58FD800454E44
     * sourseTypeHexs为CC的案例
     * 5354415254CC0770756D6138303041E75B55B8C00000404715F487FCB924402E1B466C8446044183DCC6454E44
     * @param  {[string]} hexs         [description]
     * @param  {[boolean]} needChannel  [description]
     * @return {[type]}              [description]
     */
    convertToValuesFromHexs: function(hexs, needChannel) {
        hexs = hexs.toUpperCase();
        var tempIndex = 0,
            sourseTypeHexs = hexs.substring(10, 12), //数据类型长度16进制串,AA表示为CAN+GPS类型，BB表示为K类型，CC表示为GPS类型
            expNameLengthHexs = hexs.substring(12, 14), //试验名长度16进制串
            expNameLength = parseInt(expNameLengthHexs, 16), //试验名长度，即字节数，转换为无符号整数
            expNameHexs = hexs.substring(14, (tempIndex = 14 + expNameLength * 2)); //试验名16进制串
        var reValues, channelHexs;
        if (sourseTypeHexs == "AA") {
            //AA表示为CAN+GPS类型
            var gpsTimeLength = 8, //GPS时间，占用8个字节
                gpsTimeHexs = hexs.substring(tempIndex, (tempIndex += gpsTimeLength * 2)), //GPS时间16进制串
                latLength = 8, //纬度，占用8个字节
                latHexs = hexs.substring(tempIndex, (tempIndex += latLength * 2)), //纬度16进制串
                lngLength = 8, //经度，占用8个字节
                lngHexs = hexs.substring(tempIndex, (tempIndex += lngLength * 2)), //经度16进制串
                speedLength = 4, //速度，占用4个字节
                speedHexs = hexs.substring(tempIndex, (tempIndex += speedLength * 2)); //速度16进制串
            channelHexs = hexs.substring(tempIndex, (hexs.length - 6)); //CAN或K数据通道信息16进制串
            reValues = {
                expName: HOJS.lib.parseStringFromHexs(expNameHexs),
                gpsTime: HOJS.lib.parseFloatFromHex(gpsTimeHexs, 1),
                lat: HOJS.lib.parseFloatFromHex(latHexs, 1),
                lng: HOJS.lib.parseFloatFromHex(lngHexs, 1),
                speed: HOJS.lib.parseFloatFromHex(speedHexs)
            };
        } else if (sourseTypeHexs == "BB") {
            //BB表示为K类型
            channelHexs = hexs.substring(tempIndex, (hexs.length - 6)); //CAN或K数据通道信息16进制串
            reValues = {
                expName: HOJS.lib.parseStringFromHexs(expNameHexs)
            };
        } else {
            //CC表示为GPS类型
            var gpsTimeLength = 8, //GPS时间，占用8个字节
                gpsTimeHexs = hexs.substring(tempIndex, (tempIndex += gpsTimeLength * 2)), //GPS时间16进制串
                latLength = 8, //纬度，占用8个字节
                latHexs = hexs.substring(tempIndex, (tempIndex += latLength * 2)), //纬度16进制串
                lngLength = 8, //经度，占用8个字节
                lngHexs = hexs.substring(tempIndex, (tempIndex += lngLength * 2)), //经度16进制串
                speedLength = 4, //速度，占用4个字节
                speedHexs = hexs.substring(tempIndex, (tempIndex += speedLength * 2)); //速度16进制串
            reValues = {
                expName: HOJS.lib.parseStringFromHexs(expNameHexs),
                gpsTime: HOJS.lib.parseFloatFromHex(gpsTimeHexs, 1),
                lat: HOJS.lib.parseFloatFromHex(latHexs, 1),
                lng: HOJS.lib.parseFloatFromHex(lngHexs, 1),
                speed: HOJS.lib.parseFloatFromHex(speedHexs)
            };
        }
        reValues.sourseType = sourseTypeHexs.toUpperCase();
        if (channelHexs && needChannel) {
            //如果channelHexs全是0说明channel数据为空
            if (!/^0+$/.test(channelHexs)) {
                /**
                 * [reg description]
                 * 匹配整个CAN或K数据通道（最多20个通道）16进制串中每个CAN或K数据通道（5个字节，即10个16进制字符）
                 * 匹配后把整个CAN或K数据通道拆分成数组了，数组长度为通道个数，数组中每个元素表示一个通道
                 * @type {RegExp}
                 */
                var reg = /(\d|[a-fA-F]){10}/g;
                var channels = channelHexs.match(reg).map(function(n) {
                    //每个CAN或K数据通道占用5个字节，即10个16进制字符
                    //匹配到每个CAN或K数据通道后，把它解析出来，并分别放入一个长度为2的数组中，
                    //第一个元素解析通道名序号（1个字节），第二个元素解析通道值（4个字节）
                    //这里要加join返回字符串而不直接返回数组的原因是在ie浏览器中不支持数组的map函数，
                    //而其替代方案$.map虽然可以实现类似功能，但$.map有一个bug，那就是map中返回值不可以为数组，
                    //如果为数组则返回值会直接拼接(即concat)到总数组结果中
                    return [n.substring(0, 2), n.substring(2)].join(",");
                });
                var channelsCount = channels.length;
                var channelItem,
                    channelIndex,
                    channelValue;
                //循环所有channels，并把通道名序号作为json键名，通道值作为json键值，保存把reValues中
                for (var i = 0; i < channelsCount; i++) {
                    channelItem = channels[i].split(",");
                    channelIndex = parseInt(channelItem[0], 16);
                    channelValue = HOJS.lib.parseFloatFromHex(channelItem[1]);
                    reValues[channelIndex] = channelValue;
                }
            }
        }
        //四舍五入到适当小数位数
        for(var k in reValues){
            if(!reValues.hasOwnProperty(k)){
                //防止循环到prototype
                continue;
            }
            switch (k) {
                case "expName":
                    //不处理
                    break;
                case "gpsTime":
                    //转成时间字符串
                    reValues[k] = parseFloat(reValues[k]);
                    if(reValues[k] > 0){
                        reValues[k] = HOJS.lib.parseMillisecondsToDate(reValues[k]*1000,"1904-01-01").format("yyyy-MM-dd hh:mm:ss");
                    }
                    break;
                case "lat":
                    //不处理
                    break;
                case "lng":
                    //不处理
                    break;
                case "speed":
                    reValues[k] = HOJS.lib.deci(reValues[k],2);
                    break;
                default:
                    if(typeof reValues[k] == "number"){
                        reValues[k] = HOJS.lib.deci(reValues[k],2);
                    }
                    break;
            }
        }
        return reValues;
    },
    convertChannelNames: function(channelData) {
        var reJson = {};
        for (var k in channelData) {
            if(!channelData.hasOwnProperty(k)){
                //防止循环到prototype
                continue;
            }
            switch (k) {
                case "lat":
                    reJson["纬度"] = channelData[k];
                    break;
                case "lng":
                    reJson["经度"] = channelData[k];
                    break;
                case "receiveTime":
                    reJson["接收时间"] = channelData[k];
                    break;
                case "sourseType":
                    reJson["数据类型"] = channelData[k];
                    break;
                case "expName":
                    reJson["试验名称"] = channelData[k];
                    break;
                case "gpsTime":
                    reJson["卫星时间"] = channelData[k];
                    break;
                case "speed":
                    reJson["速度"] = channelData[k];
                    break;
                default:
                    reJson[config.channelNames[k-1]] = channelData[k];
                    break;
            }
        }
        delete reJson["数据类型"];
        delete reJson["试验名称"];
        //delete reJson["gps时间"];
        return reJson;
    },
    /**
     * [filterErrDot 过滤掉数组中的异常数据点]
     * @param  {[array]} arr     [要过滤的数组]
     * @param  {[json]} option [
     * 键名:要对比的属性名称
     * 键值:属性名称对应的比较值，即最小差值
     * ]
     * 先根据options，循环arr，对比每个相邻元素之前的差值，筛选出差值超出的options.value的索引集合
     * 然后根据异点都是连续的两个索引中的第一个的原则，进一步从上述筛选中的索引数组中筛选出真正的异常数据点索引集合
     * 最后再删除arr中异常数据点索引对应的元素
     */
    filterErrDots:function(arr,option,optionMaxMin){
        if(!option){
            option = {
                "lat":0.002,
                "lng":1
            }
        }
        if(!optionMaxMin){
            optionMaxMin = {
                "speed":{max:250}
            }
        }
        if(arr.length < 3){
            return;
        }
        var tempValue = undefined,//临时缓存当前索引下要对比的属性名称对应的属性值
            tempFirstIndex = 0,//头索引，即第一个非空(要对比的属性名称对应的属性值非空)索引值，该索引是否为异常数据点需要单独判断
            tempLastIndex = 0,//尾索引，即最后一个非空(要对比的属性名称对应的属性值非空)索引值，该索引是否为异常数据点需要单独判断
            exceededIndexs = {},//差值超出的options.value的索引集合
            errDotIndexs = {},//真正的异常数据点索引集合
            tempIndexs = {},//临时索引，缓存最近三个非空(要对比的属性名称对应的属性值非空)索引，用于辅助判断arr中的头和尾索引的元素是否为异常数据点
            tempPreIndex = {},//临时索引，当当前索引下的数据为空时，临时缓存上一次不为空的索引，用于arr中存在要对比的属性名称对应的属性值为空的情况下的问题
            indexsForRemove = [],//所有要对比的属性名称下需要删除的异常数据点索引集合
            tempMax,tempMin;
        for(var k in option){
            if(!option.hasOwnProperty(k)){
                //防止循环到prototype
                continue;
            }
            exceededIndexs[k] = [];
            errDotIndexs[k] = [];
            tempIndexs[k] = [];
            tempPreIndex[k] = undefined;
        }
        //先根据options，循环arr，对比每个相邻元素之前的差值，筛选出差值超出的options.value的索引集合
        for(var i = 0,len = arr.length;i < len;i++){
            for(var k in option){
                if(!option.hasOwnProperty(k)){
                    //防止循环到prototype
                    continue;
                }
                tempValue = arr[i][k];
                if(tempValue == undefined){
                    if(tempPreIndex[k] == undefined && i > 0 && arr[i - 1][k] != undefined){
                        tempPreIndex[k] = i - 1;
                    }
                }
                else{
                    if(tempPreIndex[k] == undefined){
                        //tempPreIndex为空，说明上一个点非空，直接对比上一个点差值即可
                        if(i > 0){
                            if(Math.abs(tempValue - arr[i - 1][k]) >= option[k]){
                                exceededIndexs[k].push(i);
                            }
                        }
                    }
                    else{
                        //反之，说明上一个点为空，需要对比上一次缓存的非空点
                        if(Math.abs(tempValue - arr[tempPreIndex[k]][k]) >= option[k]){
                            exceededIndexs[k].push("T" + tempPreIndex[k]);//把tempPreIndex用前缀T的方式记录下来
                            exceededIndexs[k].push(i);
                        }
                    }
                    tempPreIndex[k] = undefined;
                    tempIndexs[k].push(i);
                    //单独判断头索引是否为异常点
                    if(tempIndexs[k].length == 3){
                        //当长度刚好从0增加到3的时候，正好tempIndexs的长度够用于判断arr中的头索引的元素是否为异常数据点
                        //而且长度只有一次会等于3，后面长度都保持为4，正符合只要算一次头索引是否为异常点
                        //其中tempIndexs[k][0]为头索引，tempIndexs[k][1]及tempIndexs[k][2]分别为紧接头索引后面的两个索引
                        //只有tempIndexs[k][0]同时与tempIndexs[k][1]及tempIndexs[k][2]的差值超出范围时才为异常点
                        tempFirstIndex = tempIndexs[k][0];
                        if(Math.abs(arr[tempFirstIndex][k] - arr[tempIndexs[k][1]][k]) >= option[k] && 
                            Math.abs(arr[tempFirstIndex][k] - arr[tempIndexs[k][2]][k]) >= option[k]){
                            //如果头索引为异常点，则把其索引号添加到异常索引集合的第一个位置
                            exceededIndexs[k].unshift("T" + tempFirstIndex);//增加这个T头的目的是为了统一头尾及中间索引的算法
                            exceededIndexs[k].unshift(tempFirstIndex);
                        }
                    }
                    //保持长度为3，而且之后长度永远为3
                    if(tempIndexs[k].length > 3){
                        tempIndexs[k].shift();
                    }
                }
            }
            //判断tempValue是否超出optionMaxMin定义的最大最小值
            for(var k in optionMaxMin){
                if(!optionMaxMin.hasOwnProperty(k)){
                    //防止循环到prototype
                    continue;
                }
                tempValue = arr[i][k],
                tempMax = optionMaxMin[k].max,
                tempMin = optionMaxMin[k].min;
                if(tempValue != undefined){
                    if((tempMax != undefined && tempValue > tempMax) || (tempMin != undefined && tempValue < tempMin)){
                        indexsForRemove.push(i);
                    }
                }
            }
        }
        //单独判断尾索引是否为异常点
        //最后三个非空索引值正好保存在tempIndexs[k]中，尾索引正好等于tempIndexs[k][2]
        //只有tempIndexs[k][2]同时与tempIndexs[k][0]及tempIndexs[k][1]的差值超出范围时才为异常点
        for(var k in option){
            if(!option.hasOwnProperty(k)){
                //防止循环到prototype
                continue;
            }
            if(tempPreIndex[k] == undefined){
                tempLastIndex = arr.length - 1;
            }
            else{
                tempLastIndex = tempPreIndex[k];
            }
            if(tempIndexs[k].length < 3){
                //当非空值个数小于3时，不进行尾索引判断
            }
            else if(tempIndexs[k].length > 3){
                console.warn("filterErrDots算法异常，tempIndexs[k].length长度应该为3，而这里为%@".fmt(tempIndexs[k].length));
            }
            else if(tempLastIndex != tempIndexs[k][2]){
                console.warn("filterErrDots算法异常，tempLastIndex应该正好等于tempIndexs[k][2]，即%@，而这里为%@".fmt(tempIndexs[k][2],tempLastIndex));
            }
            else{
                if(Math.abs(arr[tempLastIndex][k] - arr[tempIndexs[k][0]][k]) >= option[k] && 
                    Math.abs(arr[tempLastIndex][k] - arr[tempIndexs[k][1]][k]) >= option[k]){
                    //如果尾索引为异常点，则把其索引号添加到异常索引集合的最后一个位置
                    exceededIndexs[k].push("T" + tempLastIndex);//只增加T符号正好足够把尾索引标记为异常点，而没有必要再增加索引(如果为异常点之前肯定会在尾处添加)
                }
            }
        }

        //然后根据异点都是连续的两个索引中的第一个的原则，进一步从上述筛选中的索引数组中筛选出真正的异常数据点索引集合
        //连续的两个索引有两种情况，一种是两个索引真正的连续，另一种是两个索引之前隔的全是空值，即T符号标记的索引
        var tempIndex = "";
        var tempNextIndex = "";
        for(var k in option){
            if(!option.hasOwnProperty(k)){
                //防止循环到prototype
                continue;
            }
            for(var i = 0,len = exceededIndexs[k].length;i < len - 1;i++){
                tempIndex = exceededIndexs[k][i];
                tempNextIndex = exceededIndexs[k][i + 1];
                if(tempIndex + 1 == tempNextIndex || "T" + tempIndex == tempNextIndex){
                    errDotIndexs[k].push(tempIndex);
                }
            }
        }
        for(var k in option){
            if(!option.hasOwnProperty(k)){
                //防止循环到prototype
                continue;
            }
            indexsForRemove = indexsForRemove.concat(errDotIndexs[k]);
        }
        indexsForRemove = indexsForRemove.distinct();
        //执行删除操作，把indexsForRemove中的索引对应的元素全部删除
        //先让indexsForRemove按降序排序，这样就可以直接删除索引处的值而不引起索引超出异常报错
        indexsForRemove.sort(function(a,b){return b-a;});
        for(var i = 0,len = indexsForRemove.length;i < len;i++){
            arr.splice(indexsForRemove[i],1);
        }
    }
}

Ember.Object.reopen({
    classifyKeys:function(data){
        //只把data的第一层序列化成字符串，否则会造成c#无法收到post数据
        var reJson = {};
        for(var k in data){
            // reJson[Ember.String.classify(k)] = JSON.stringify(data[k]);
            reJson[Ember.String.classify(k)] = data[k];
        };
        return reJson;
    },
    underscoreKeys:function(data){
        //只把data的第一层序列化成字符串，否则会造成c#无法收到post数据
        var reJson = {};
        for(var k in data){
            reJson[Ember.String.underscore(k)] = data[k];
        };
        return reJson;
    },
    classifys:function(){
        return this.classifyKeys(JSON.parse(JSON.stringify(this)));
    },
    underscores:function(){
        return this.underscoreKeys(JSON.parse(JSON.stringify(this)));
    }
});

MobileApp.Model = Ember.Object.extend({
    init:function(){
        this.set("errors",DS.Errors.create());
    },
    isSaving:false,
    isUnSavable:function(){
        var errors = this.get("errors");
        var hasServerSideError = errors.has("server_side_error");
        var isSaving = this.get("isSaving");
        if(isSaving){
            return true;
        }
        else{
            if(hasServerSideError && errors.get("length") == 1){
                //当只有服务器错误的时候允许保存
                return false;
            }
            else{
                return errors.get("length") > 0;
            }
        }
    }.property("errors.length","isSaving"),
    action:"",//对应到webservice的methed
    members:[],
    generateUrl:function(){
        var origin = MobileApp.get("origin"),
            namespace = MobileApp.get("namespace"),
            action = this.get("action");
        return "%@%@.asmx/%@".fmt(origin,namespace,Ember.String.classify(action));
    },
    tryPost:function(){
        return this.ajax("POST");
    },
    tryGet:function(){
        return this.ajax("GET");
    },
    ajaxOptions:function (type,url){
        var opt = {},
            members = this.get("members");
        opt.url = url;
        opt.type = type;
        opt.contentType="application/json; charset=utf-8";
        opt.dataType="json";
        //加上async及cache属性的设置保证IE上不会出现请求不完整的失败情况
        opt.async=true;
        opt.cache = false;
        if(members.length){
            var data = this.getProperties(members);
            opt.data = JSON.stringify(this.classifyKeys(data));
        }
        return opt;
    },
    ajax:function (type){
        var self = this;
        var url = self.generateUrl();
        this.set("isSaving",true);
        return new Ember.RSVP.Promise(function(resolve, reject) {
            var hash = self.ajaxOptions(type,url);
            hash.success = function(json, textStatus, jqXHR) {
                json = self.ajaxSuccess(jqXHR, json);
                Ember.run(null, resolve, json);
            };
            hash.error = function(jqXHR, textStatus, errorThrown) {
                Ember.run(null, reject, self.ajaxError(jqXHR, jqXHR.responseText));
            };
            Ember.$.ajax(hash);
        }, "MobileApp.Model#ajax " + type + " to " + url);
    },
    ajaxSuccess:function(jqXHR, jsonPayload){
        this.set("isSaving",false);
        var data = JSON.parse(jsonPayload.d);
        var dataObj = Ember.Object.create(this.underscoreKeys(data));
        var dataErrors = dataObj.get("errors");
        if(dataErrors){
            var recordErrors = this.get('errors');
            Ember.keys(dataErrors).forEach(function (key) {
                recordErrors.add(Ember.String.underscore(key), dataErrors[key]);
            });
            delete dataObj.errors;
        }
        return dataObj;
    },
    ajaxError: function(jqXHR) {
        this.set("isSaving",false);
        var data;
        if(jqXHR.responseJSON && jqXHR.responseJSON.d){
            data = JSON.parse(jqXHR.responseJSON.d);
        }
        else{
            data = jqXHR.responseJSON;
        }
        var dataObj = Ember.Object.create(this.underscoreKeys(data));
        if(jqXHR && jqXHR.status === 403){
            var recordErrors = this.get('errors');
            var dataErrors = dataObj.get("errors");
            Ember.keys(dataErrors).forEach(function (key) {
                recordErrors.add(Ember.String.underscore(key), dataErrors[key]);
            });
            delete dataObj.errors;
        }
        return dataObj;
    },
    notifyAllPropertyChange:function(){
        var opt = {},
            members = this.get("members");
        if(members.length){
            opt = this.getProperties(members);
            for(var k in opt){this.notifyPropertyChange(k)}
        }
    }
});

MobileApp.ApplicationRoute = Ember.Route.extend({
    beforeModel: function(transition) {
        window.document.title = this.controllerFor("application").get("appTitle");
        var startupController = this.controllerFor("startup");
        var sessionController = this.controllerFor("session");
        if(!startupController.get("isStartupLoaded") && transition.targetName != "startup"){
            startupController.set("previousTransition",transition);
        }
        sessionController.send("syncLocal","init");
    },
    model: function(params, transition) {

    },
    afterModel: function(model, transition) {

    },
    setupController: function(controller, model) {
    },
    actions:{
        loading: function() {
            var view = this.container.lookup('view:loading').append();
            this.router.one('didTransition', view, 'destroy');
        },
        error: function(reason) {
            console.log(reason);
            console.log(reason.stack);
            alert(reason.message);
        },
        goLogin:function(){
            this.transitionTo('login');
        },
        goIndex:function(){
            this.transitionTo('index');
        },
        goStart:function(){
            this.transitionTo('start');
        },
        goStartup:function(){
            this.transitionTo('startup');
        },
        goAbout:function(){
            var currentPath = this.get("controller.currentPath");
            this.controllerFor("about").set("previousPath",currentPath);
            this.transitionTo("about");
        }
    }
});

MobileApp.IndexRoute = Ember.Route.extend({
    beforeModel: function() {
        var isLogined = this.controllerFor("session").get("isLogined");
        if(isLogined){
            this.transitionTo('start');
        }
        else{
            this.transitionTo('login');
        }
    }
});

MobileApp.ApplicationController = Ember.Controller.extend({
    needs:["session","mapplayer"],
    appName: 'Horizon Vehicle Test Managerial System.',
    appTitle:"整车试验管理系统",
    author:"上海好耐电子科技有限公司 M&T HORIZON",
    authorSite:"http://www.mthorizon.com/",
    copyright:"版权所有 copyright 2015",
    version:"版本号 1.1.0",
    panelTitle:function(){
        var currentRouteName = this.get("currentRouteName");
        var title;
        switch(currentRouteName){
            case "unitscene.index":
                title = "现场实录";
                break;
            case "unitscene.unitmap.index":
                title = "现场实录";
                break;
            case "unitplay.index":
                title = "地图回放";
                break;
            case "unitplay.playfilter.index":
                title = "筛选试验";
                break;
            case "unitplay.playtimer.index":
                title = "地图回放";
                break;
            case "unitplay.playtimer.mapplayer.index":
                title = "地图回放";
                break;
            default:
                title = this.get("appTitle");
        }
        return title;
    }.property("currentRouteName"),
    isInMainRoute:function(){
        var currentRouteName = this.get("currentRouteName");
        return currentRouteName == "login" || currentRouteName == "start.index";
    }.property("currentRouteName"),
    isInPlayRoute:function(){
        var currentRouteName = this.get("currentRouteName");
        return currentRouteName == "unitplay.playtimer.mapplayer.index";
    }.property("currentRouteName"),
    actions:{
        logout:function(){
            this.get("controllers.session").send("logout",true);
        }
    }
});


MobileApp.ApplicationView = Ember.View.extend({
    templateName: 'application',
    classNames:['app-view']
});


MobileApp.Router.map(function () {
    this.route('login');
    this.route('startup');
    this.route('start', function () {
        this.resource('start.instances', { path: '/instances' }, function () {
            this.route('inbox',function(){
                this.resource('inbox.instance', { path: '/instance/:instance_id' }, function () {
                });
            });
            this.route('outbox',function(){
                this.resource('outbox.instance', { path: '/instance/:instance_id' }, function () {
                });
            });
        });
    });
    this.route('unitscene', function () {
        this.route('unitmap',function(){
        });
        this.route('placemap',function(){
        });
    });
    this.route('unitplay', function () {
        this.route('playfilter',function(){
        });
        this.route('playtimer',function(){
            this.route('mapplayer',function(){
                this.route('mapsetter',function(){
                });
            });
        });
    });
    this.route('about', function () {
        this.route('dns',function(){
        });
    });
});


MobileApp.LoadingView = Ember.View.extend({
  templateName: 'loading',
  classNames: 'loading-big'
});
MobileApp.NumberView = Ember.NumberView.extend({
});

MobileApp.SpinButtonComponent = Ember.Component.extend({
    classNames: ['btn-spin'],
    attributeBindings:["disabled"],
    disabled:false,
    isLoading:false,
    isIcon:false,
    loadingIcon:"glyphicon-transfer",
    loadedIcon:"glyphicon-circle-arrow-right",
    loadingText:"loading",
    tagName:"button",
    isAutoLoading:true,
    click:function(){
        if(this.get("isAutoLoading")){
            this.sendAction('action',{isFromSpinButton:true});
        }
        else{
            if(!this.get('isLoading')){
                this.set('isLoading', true);
                this.sendAction('action',{isFromSpinButton:true});
            }
        }
    }
});



