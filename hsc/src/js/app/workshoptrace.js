Hsc.StartWorkshoptracesRoute = Hsc.WorkshopsRoute.extend({
    renderTemplate: function(controller) {
        this.render('workshops',{ outlet: 'workshops',controller:controller });
    },
    beforeModel: function(transition) {
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.index');
        },
        goDetail:function(workshop){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('workshoptrace',workshop);
        }
    }
});

Hsc.WorkshoptraceRoute = Ember.Route.extend({
    controllerName: 'workshoptrace',
    beforeModel: function() {
    },
    model:function(params){
        var curId = params.workshop_id;
        var workshop = this.store.peekRecord('workshop', curId);
        var controller = this.controllerFor("workshoptrace");
        if(workshop){
            controller.set("workshop",workshop);
        }
        else{
            controller.set("workshop",null);
        }
        //返回空，以在每次切换车间组的时候清空履历列表
        return [];
    },
    afterModel: function(model, transition) {
        var controller = this.controllerFor("workshoptrace");
        if(!controller.get("workshop")){
            transition.send("goBack");
        }
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controller;
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controller;
        controller.send("navigablePop");
        Ember.run.next(this,function(){
            //立刻执行清除本地数据操作，因为这个界面可能出现大量履历数据，需要立刻优化内存
            this.controllerFor("startup").send("clearLocalDataFromStore")
        });
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.workshoptraces');
        }
    }
});

Hsc.WorkshoptraceView = Ember.View.extend({
    classNames:['start-workshoptraces-workshoptrace','navigable-pane','collapse']
});

Hsc.StartWorkshoptracesController = Ember.ArrayController.extend({
    pannelTitle:"车间组履历",
    helpInfo:"请选择要查看履历的车间组。",
    actions:{
        navigablePush:function(){
            $(".start-index.navigable-pane").navigablePush({
                targetTo:".start-setting-workshops.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-setting-workshops.navigable-pane").navigablePop({
                targetTo:".start-index.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        }
    }
});
Hsc.WorkshoptraceController = Ember.ArrayController.extend({
    init:function(){
        this._super();
        this.set("errors",DS.Errors.create());
    },
    needs:["application","session"],
    // sortProperties: ['start_date','id'],
    // sortAscending: false,
    startDateSortingDesc: ['start_date:desc','id'],
    arrangedResult: Ember.computed.sort('model', 'startDateSortingDesc'),
    maxDateSpan:60,
    modelName:"车间组履历",
    pannelTitle:function(){
        return "车间组[%@]履历详情".fmt(this.get("workshop.number"));
    }.property("workshop"),
    startDate:null,
    endDate:null,
    workshop:null,
    isLoading:false,
    isEmpty:false,
    displayMode:"table",
    isDisplayList:Ember.computed.equal('displayMode', 'list'),
    isDisplayTable:Ember.computed.equal('displayMode', 'table'),
    isUnSearchable:function(){
        if(this.get("isLoading")){
            return true;
        }
        var errors = this.get("errors");
        var hasServerSideError = errors.has("server_side_error");
        if(hasServerSideError && errors.get("length") == 1){
            //当只有服务器错误的时候允许搜索
            return false;
        }
        else{
            return errors.get("length") > 0;
        }
    }.property("errors.length","isLoading"),
    dateDidChange:function(){
        var startDate = this.get("startDate");
        var endDate = this.get("endDate");
        this.get('errors').remove('server_side_error');
        if(startDate && endDate && !HOJS.lib.compareTime(startDate,endDate,true)){
            this.get('errors').add('startDate', '开始日期不能大于结束日期');
        }
        else if(startDate && endDate && HOJS.lib.dateDiff("D",startDate,endDate) > 60){
            this.get('errors').add('startDate', '开始日期与结束日期间隔不能超出%@天'.fmt(this.get("maxDateSpan")));
        }
        else{
            this.get('errors').remove('startDate');
        }
    }.observes("startDate","endDate"),
    startDateDidChange:function(){
        var startDate = this.get("startDate");
        var startDateValue = startDate ? startDate.format("yyyy-MM-dd") : "";
        this.set("startDateValue",startDateValue);
    }.observes("startDate"),
    endDateDidChange:function(){
        var endDate = this.get("endDate");
        var endDateValue = endDate ? endDate.format("yyyy-MM-dd") : "";
        this.set("endDateValue",endDateValue);
    }.observes("endDate"),
    startDateValueDidChange:function(){
        var startDateValue = this.get("startDateValue");
        var reg = this.get("dateReg");
        if(startDateValue){
            if(!reg.test(startDateValue)){
                this.get('errors').add('startDateValue', '开始日期格式不正确');
            }
            else{
                this.get('errors').remove('startDateValue');
                this.set("startDate",HOJS.lib.parseDate(startDateValue));
            }
        }
        else{
            this.get('errors').remove('startDateValue');
            this.get('errors').add('startDateValue','开始日期不能为空');
            this.set("startDate",null);
        }
    }.observes("startDateValue"),
    endDateValueDidChange:function(){
        var endDateValue = this.get("endDateValue");
        var reg = this.get("dateReg");
        if(endDateValue){
            if(!reg.test(endDateValue)){
                this.get('errors').add('endDateValue', '结束日期格式不正确');
            }
            else{
                this.get('errors').remove('endDateValue');
                this.set("endDate",HOJS.lib.parseDate(endDateValue));
            }
        }
        else{
            this.get('errors').remove('endDateValue');
            this.set("endDate",null);
        }
    }.observes("endDateValue"),
    errors:null,
    helpInfo:"",
    workshopDidChange:function(){
        this.send("resetSearchSet");
    }.observes("workshop"),
    dateReg:/^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)-02-29)$/,
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-setting-workshops.navigable-pane").navigablePush({
                targetTo:".start-workshoptraces-workshoptrace.navigable-pane",
                animation:Hsc.transitionAnimation,
                callBack:function(){
                    if(!controller.get("model")){
                        controller.send("goBack");
                    }
                }
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-workshoptraces-workshoptrace.navigable-pane").navigablePop({
                targetTo:".start-setting-workshops.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        setStartDate:function(){
            $( '.datepicker' ).pickadate({
                formatSubmit: 'yyyy-mm-dd',
                // min: [2015, 7, 14],
                container: '#datapicker-container',
                // editable: true,
                closeOnSelect: true,
                closeOnClear: true,
            });
            var datepickerTitle = "设置开始日期";
            var htmlDatepickerTitle = '<p class="datepicker-title">%@</p>'.fmt(datepickerTitle);
            var self = this;
            var picker = $( '.datepicker' ).pickadate('picker');
            var startDate = this.get("startDate");
            if(startDate){
                picker.set('select', startDate);
            }
            else{
                picker.set('select', null);
            }
            picker.on({
                close: function() {
                    picker.stop();
                },
                render:function(){
                    picker.$root.find('.picker__box' ).prepend(htmlDatepickerTitle);
                },
                set: function(thingSet) {
                    if(thingSet.select){
                        var value = this.get("select").obj;
                        // var valueFormated = this.get("select", 'yyyy-mm-dd');
                        self.set("startDate",value);                        
                    }
                    else if(thingSet.highlight){
                        var value = this.get("highlight").obj;
                        self.set("startDate",value);                        
                    }
                    else{
                        self.set("startDate",null);  
                    }
                }
            });
            picker.$root.find('.picker__box' ).prepend('<p class="datepicker-title">%@</p>'.fmt(datepickerTitle));
            picker.open(false);
        },
        setEndDate:function(){
            $( '.datepicker' ).pickadate({
                formatSubmit: 'yyyy-mm-dd',
                // min: [2015, 7, 14],
                container: '#datapicker-container',
                // editable: true,
                closeOnSelect: true,
                closeOnClear: true,
            });
            var datepickerTitle = "设置结束日期";
            var htmlDatepickerTitle = '<p class="datepicker-title">%@</p>'.fmt(datepickerTitle);
            var self = this;
            var picker = $( '.datepicker' ).pickadate('picker');
            var endDate = this.get("endDate");
            if(endDate){
                picker.set('select', endDate);
            }
            else{
                picker.set('select', null);
            }
            picker.on({
                close: function() {
                    picker.stop();
                },
                render:function(){
                    picker.$root.find('.picker__box' ).prepend(htmlDatepickerTitle);
                },
                set: function(thingSet) {
                    if(thingSet.select){
                        var value = this.get("select").obj;
                        // var valueFormated = this.get("select", 'yyyy-mm-dd');
                        self.set("endDate",value);                        
                    }
                    else if(thingSet.highlight){
                        var value = this.get("highlight").obj;
                        self.set("endDate",value);                        
                    }
                    else{
                        self.set("endDate",null);  
                    }
                }
            });
            picker.$root.find('.picker__box' ).prepend(htmlDatepickerTitle);
            picker.open(false);
        },
        syncDateValue:function(){
            var startDateValue = this.get("startDateValue"),
                endDateValue = this.get("endDateValue");
            // var reg = /\d{4}-\d{2}-\d{2}/;
            var reg = this.get("dateReg");
            if(startDateValue){
                if(reg.test(startDateValue)){
                    this.set("startDate",HOJS.lib.parseDate(startDateValue));
                }
                else{
                    this.set("startDate",null);
                }
            }
            if(endDateValue){
                if(reg.test(endDateValue)){
                    this.set("endDate",HOJS.lib.parseDate(endDateValue));
                }
                else{
                    this.set("endDate",null);
                }
            }
        },
        setSortAscending:function(v){
            this.set("sortAscending",v);
        },
        setDisplayMode:function(v){
            this.set("displayMode",v);
            if(this.get("isDisplayList")){
                //切换为列表显示模式时只能用降序排列
                this.send("setSortAscending",false);
            }
        },
        search:function(){
            this.get('errors').remove('server_side_error');
            this.send("syncDateValue");
            this.notifyPropertyChange("startDate");
            this.notifyPropertyChange("endDate");
            if(this.get("isUnSearchable")){
                return;
            }
            this.set("isEmpty",false);
            this.set("isLoading",true);
            var startDate = this.get("startDate");
            var serializedStartDate = startDate ? Hsc.DateTransform.prototype.serialize.call(null,startDate) : null;
            serializedStartDate = serializedStartDate ? "\"%@\"".fmt(serializedStartDate): null;//作为url参数一定要带引号，否则后台无法识别
            var endDate = this.get("endDate");
            var serializedEndDate = endDate ? Hsc.DateTransform.prototype.serialize.call(null,endDate) : null;
            serializedEndDate = serializedEndDate ? "\"%@\"".fmt(serializedEndDate) : null;//作为url参数一定要带引号，否则后台无法识别
            this.store.find('trace', { 
                type: "traces_by_workshop",
                workshop: this.get("workshop.id"),
                start_date: serializedStartDate,
                end_date: serializedEndDate
            }).then(function(answer){
                this.set("model",answer.toArray());
                this.set("isLoading",false);
                var workshopNumber = this.get("workshop.number");
                if(startDate && endDate){
                    this.set("helpInfo","以下为车间组[%@]在%@与%@范围内的履历列表".fmt(workshopNumber,startDate.format("yyyy-MM-dd"),endDate.format("yyyy-MM-dd")));
                }
                else if(startDate){
                    this.set("helpInfo","以下为车间组[%@]在%@之后的履历列表".fmt(workshopNumber,startDate.format("yyyy-MM-dd")));

                }
                else if(endDate){
                    this.set("helpInfo","以下为车间组[%@]在%@之前的履历列表".fmt(workshopNumber,endDate.format("yyyy-MM-dd")));
                }
                else{
                    this.set("helpInfo","以下为车间组[%@]的全部履历列表".fmt(workshopNumber));
                }
                if(answer.get("length")){
                    this.send("loadDependentCars");
                }
                else{
                    this.set("isEmpty",true);
                }
            }.switchScope(this),function(reason){
                if(reason.errors && reason.errors.errors){
                    var errors = reason.errors.errors;
                    var recordErrors = this.get("errors");
                    Ember.keys(errors).forEach(function (key) {
                        recordErrors.add(Ember.String.underscore(key), errors[key]);
                    });
                }
                this.set("isLoading",false);
            }.switchScope(this));
        },
        loadDependentCars:function(){
            //从model中找到没有加载过来的car记录，然后把id集合返回到服务器攫取相应car记录
            var carIds = this.get("model").filterBy("car.isLoaded",false).toArray().mapProperty("car.id").join(",");
            if(!carIds){
                return;
            }
            this.store.find('car', { 
                type: "fetch_by_ids",
                ids: carIds
            }).then(function(answer){

            }.switchScope(this),function(reason){
                if(reason.errors && reason.errors.errors){
                    var errors = reason.errors.errors;
                    var recordErrors = this.get("errors");
                    Ember.keys(errors).forEach(function (key) {
                        recordErrors.add(Ember.String.underscore(key), errors[key]);
                    });
                }
            }.switchScope(this));
        },
        resetSearchSet:function(){
            //重置搜索相关设置
            this.beginPropertyChanges();
            // this.set("startDate",null);
            // this.set("endDate",null);
            this.set("isEmpty",false);
            this.set("isLoading",false);
            this.set("helpInfo","请点击搜索或输入日期[YYYY-MM-DD]范围(不能超出%@天)后点击搜索来查询车间组[%@]的履历列表。".fmt(this.get("maxDateSpan"),this.get("workshop.number")));
            // this.set("sortAscending",false);
            this.endPropertyChanges();
        }
    }
});