MobileApp.UnitplayPlaytimerRoute = Ember.Route.extend({
    beforeModel: function(transition) {
        if(!this.controllerFor("unitplay").get("experiment")){
            transition.send("goBack");
        }
    },
    model:function(params, transition){
        return MobileApp.Playtimer.create();
    },
    setupController: function(controller, model) {
        this._super(controller, model);
        var unitplayController = controller.get("controllers.unitplay");
        model.set("experiment",unitplayController.get("experiment"));
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
        var controller = this.controllerFor("unitplay_playtimer");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            MobileApp.transitionAnimation = "slideHorizontal";
            this.transitionTo('unitplay');
        },
        goMapplayer:function(){
            MobileApp.transitionAnimation = "slideHorizontal";
            this.transitionTo('unitplay.playtimer.mapplayer');
        }
    }
});

MobileApp.Playtimer = MobileApp.Model.extend({
    members:["experiment","start_time","end_time"],
    action:"playtimer",
    experiment:null,
    isDatesExpanded:false,
    dates:[],
    start_time:"",
    end_time:"",
    dateDidChange:function(){
        var start_time = this.get("start_time"),
            end_time = this.get("end_time"),
            expStartTime = this.get("experiment.start_time"),
            expEndTime = this.get("experiment.end_time");
        var errMsgForSt,errMsgForEt;
        if(Ember.isEmpty(start_time)){
            errMsgForSt = "不能为空";
        }
        else if(!HOJS.lib.compareTime(expStartTime,start_time)){
            errMsgForSt = "开始时间不能小于试验开始时间";
        }
        if(Ember.isEmpty(end_time)){
            errMsgForEt = "不能为空";
        }
        else if(expEndTime && !HOJS.lib.compareTime(end_time,expEndTime)){
            errMsgForEt = "结束时间不能大于试验结束时间";
        }

        if(Ember.isEmpty(errMsgForSt) && Ember.isEmpty(errMsgForEt) && start_time && end_time){
            if(!HOJS.lib.compareTime(start_time,end_time,true)){
                errMsgForSt = "开始时间必须小于结束时间";
                errMsgForEt = "开始时间必须小于结束时间";
            }
        }
        if(Ember.isEmpty(errMsgForSt)){
            this.get('errors').remove('start_time');
        }
        else{
            this.get('errors').remove('start_time');
            this.get('errors').add('start_time', errMsgForSt);
        }
        if(Ember.isEmpty(errMsgForEt)){
            this.get('errors').remove('end_time');
        }
        else{
            this.get('errors').remove('end_time');
            this.get('errors').add('end_time', errMsgForEt);
        }
    }.observes("start_time","end_time")
});

MobileApp.UnitplayPlaytimerView = Ember.View.extend({
    classNames:['unitplay-playtimer','navigable-pane','collapse','h100per']
});

MobileApp.UnitplayPlaytimerController = Ember.ObjectController.extend({
    needs:["session","unitplay","places"],
    isLoadingDates:false,
    maxTimespan:3*24,//开始结束时间最大小时差
    isTimespanOut:false,
    checkTimespan:function(){
        var isTimespanOut = false;
        if(this.get("model.errors.length")){
            isTimespanOut = false;
        }
        var start_time = this.get("start_time"),
            end_time = this.get("end_time");
        if(start_time && start_time && HOJS.lib.dateDiff("H",start_time,end_time) > this.get("maxTimespan")){
            isTimespanOut = true;
        }
        else{
            isTimespanOut = false;
        }
        this.set("isTimespanOut",isTimespanOut);
        return !isTimespanOut;
    },
    dateDidChange:function(){
        this.set("isTimespanOut",false);
    }.observes("start_time","end_time"),
    initDateTime:function(){
        var expStartTime = this.get("experiment.start_time"),
            expEndTime = this.get("experiment.end_time");
        this.set("model.start_time",expStartTime);
        this.set("model.end_time",expEndTime);
        var minDate = (new Date()).addYears(-50),
            maxDate = (new Date()).addYears(50);
        var options = {
            theme: "ios",
            mode: "scroller",
            display: "modal",
            lang: "zh",
            minDate: minDate,
            maxDate: maxDate,
            stepMinute: 1,
            dateFormat:"yyyy-mm-dd",
            timeFormat:"HH:ii:ss",
            timeWheels:"HHiiss",
            // defaultValue:new Date(expStartTime)
            // buttons:['set', 'cancel', 'clear', 'now']
        }
        options.defaultValue = new Date(expStartTime);
        $("#start_time").mobiscroll().datetime(options);
        if(expEndTime){
            options.defaultValue = new Date(expEndTime);
        }
        $("#end_time").mobiscroll().datetime(options);
    },
    actions:{
        navigablePush:function(){
            $(".unitplay-index.navigable-pane").navigablePush({
                targetTo:".unitplay-playtimer.navigable-pane",
                animation:MobileApp.transitionAnimation
            });
            MobileApp.transitionAnimation = "none";
            this.initDateTime();
        },
        navigablePop:function(){
            $(".unitplay-playtimer.navigable-pane").navigablePop({
                targetTo:".unitplay-index.navigable-pane",
                animation:MobileApp.transitionAnimation
            });
            MobileApp.transitionAnimation = "none";
        },
        toggleDates:function(){
            this.toggleProperty("isDatesExpanded");
            if(this.get("isDatesExpanded") && this.get("model.dates.length") == 0){
                this.send("fetchDates");
            }
        },
        fetchDates:function(){
            this.set("isLoadingDates",true);
            var sessionController = this.get("controllers.session");
            var experiment = this.get("model.experiment"),
                unit = experiment.get("unit_id"),
                startTime = experiment.get("start_time"),
                endTime = experiment.get("end_time");
            var fetcher = MobileApp.DataReceiveDaysByUnitAndTimeFetcher.create({
                token:sessionController.genrateToken(),
                log_id:localStorage.getItem("log_id"),
                unit:unit,
                start_time:startTime,
                end_time:endTime
            });
            var promise = fetcher.tryPost();
            promise.then(function(result){
                this.set("isLoadingDates",false);
                var receiveDays = result.get("receive_days");
                if(receiveDays){
                    this.set("dates",receiveDays.split(","));
                }
                else{
                    this.set("dates",[]);
                }
            }.switchScope(this),function(reason){
                this.set("isLoadingDates",false);
            }.switchScope(this));
        },
        start:function(){
            this.get("model").notifyAllPropertyChange();
            if(this.get("model.errors.length") == 0){
                if(this.checkTimespan()){
                    this.send("goMapplayer");
                }
            }
        },
        continue:function(){
            this.send("goMapplayer");
        },
        break:function(){
            this.set("isTimespanOut",false);
        }
    }
});

