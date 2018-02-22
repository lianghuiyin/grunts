Hsc.StartCarsRoute = Ember.Route.extend({
    renderTemplate: function() {
        this.render({ outlet: 'cars' });
    },
    beforeModel: function(transition) {
        var sessionController = this.controllerFor("session");
        return sessionController.checkIsCarOwners(transition);
    },
    model: function () {
        return this.store.peekAll('car');
    },
    afterModel: function(model, transition) {
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
        var controller = this.get("controller");
        controller.send("navigablePop");
        //出于性能考虑才加的run.next
        Ember.run.next(this,function(){
            var controller = this.get("controller");
            controller.send("clearLocalRetiredCars");
            controller.send("resetSearchSet");
        });
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.index');
        },
        goDetail:function(car){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('car',car);
        },
        goNew:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.cars.new');
            Ember.run.next(this,function(){
                //新建车辆需要清除之前的搜索项，这样当新建成功并返回列表可以直接看到刚新建的车辆在第一条
                var controller = this.get("controller");
                controller.send("clearLocalRetiredCars");
                controller.send("resetSearchSet");
            });
        }
    }
});
Hsc.StartCarsNewRoute = Ember.Route.extend({
    controllerName: 'car',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",true);
        controller.set("pannelTitle",Hsc.get("newModelTag").fmt(controller.get("modelName")));
        this.render('car', {outlet: 'car',controller: controller});
    },
    beforeModel: function() {
    },
    model:function(){
        return this.controllerFor("start_cars").createRecord();
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("car");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("car");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.cars');
        }
    }
});
Hsc.CarRoute = Ember.Route.extend({
    controllerName: 'car',
    beforeModel: function() {
    },
    model:function(params){
        var curId = params.car_id;
        var car = this.store.peekRecord('car', curId);
        if(!car && curId.indexOf("fixture") == 0){
            //如果没有找到记录，并且是fixture开头的新记录则创建一个新记录来匹配
            return this.controllerFor("start_cars").createRecord();
        }
        else{
            //注意，这里如果没有找到记录，并且不是fixture开头的新记录，将返回null
            return car;
        }
    },
    afterModel: function(model, transition) {
        if(!model){
            transition.send("goBack");
        }
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("car");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("car");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.cars');
        }
    }
});
Hsc.CarIndexRoute = Ember.Route.extend({
    controllerName: 'car',
    renderTemplate: function(controller) {
        controller.set("isEditing",false);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("detailModelTag").fmt(controller.get("modelName")));
        this.render('car',{ outlet: 'car',controller: controller });
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        //在这个路由中可能出现删除失败的情况，所以也需要回滚
        var controller = this.controllerFor("car");
        var model = controller.get("model");
        // model && model.rollbackAttributes();
        //删除数据失败需要还原，这里增加hasDirtyAttributes的判断，是因为删除成功的话hasDirtyAttributes为false，这时如果执行rollbackAttributes会造成model显示为没有删除成功
        if(model && model.get("hasDirtyAttributes")){
            model.rollbackAttributes();
        }
        return this;
    },
    actions:{
        goEdit:function(){
            this.transitionTo('car.edit');
        },
        goNewinstance:function(){
            this.transitionTo('car.newinstance');
        },
        goAbortinstance:function(){
            this.transitionTo('car.abortinstance');
        },
        goRetire:function(){
            this.transitionTo('car.retire');
        },
        goRestore:function(){
            this.transitionTo('car.restore');
        }
    }
});
Hsc.CarEditRoute = Ember.Route.extend({
    controllerName: 'car',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("editModelTag").fmt(controller.get("modelName")));
        this.render('car', {outlet: 'car',controller: controller});
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        var controller = this.controllerFor("car");
        var model = controller.get("model");
        // model && model.rollbackAttributes();
        //这里要增加删除的判断，是因为如果该记录被其他用户删除然后push过来的话，rollbackAttributes会把删除的记录撤销
        if(model && !model.get("isDeleted")){
            model.rollbackAttributes();
        }
        return this;
    },
    actions:{
        goIndex:function(){
            this.transitionTo('car.index');
        },
    }
});

Hsc.Car = DS.Model.extend({
    number: DS.attr('string'),
    owner: DS.belongsTo('user'),
    testtype: DS.belongsTo('testtype'),
    vehicletype: DS.belongsTo('vehicletype'),
    status: DS.attr('string', {defaultValue: "unused"}),//闲置（unused）、流转中（turning）、退役（retired）
    description: DS.attr('string',{defaultValue: ""}),
    creater: DS.attr('string'),
    created_date: DS.attr('date'),
    modifier: DS.attr('string'),
    modified_date: DS.attr('date'),
    createrObject:function(){
        return this.store.peekRecord("user",this.get("creater"));
    }.property("creater"),
    modifierObject:function(){
        return this.store.peekRecord("user",this.get("creater"));
    }.property("creater"),
    searchKeys:function(){
        if(!this.get("id")){
            return [];
        }
        var status = this.get("status");
        var statusName = "";
        switch(status){
            case "unused":
                statusName = "闲置";
                break;
            case "turning":
                statusName = "流转中";
                break;
            case "retired":
                statusName = "退役";
                break;
        }
        var testtypeName = this.get("testtype.name");
        testtypeName = testtypeName ? testtypeName.toLowerCase() : "";
        var vehicletypeName = this.get("vehicletype.name");
        vehicletypeName = vehicletypeName ? vehicletypeName.toLowerCase() : "";
        var keys = [this.get("number").toLowerCase(),
            statusName.toLowerCase(),
            vehicletypeName,
            testtypeName];
        //ie8性能问题，所以不把与relInstance相关的关键字预先处理，在实际搜索事件中单独处理
        // var currentStep = this.get("relInstance.lastTrace.step");
        // if(currentStep){
        //     keys.push(currentStep.get("name"));
        // }
        // var relUser = this.get("relInstance.inbox_user");
        // if(relUser){
        //     keys.push(relUser.get("name"));
        // }
        return keys;
    }.property("number","status","owner.name","testtype.name"),
    isUnused:function(){
        return this.get("status") == "unused";
    }.property("status"),
    isTurning:function(){
        return this.get("status") == "turning";
    }.property("status"),
    isRetired:function(){
        return this.get("status") == "retired";
    }.property("status"),
    relInstances:function(){
        var self = this;
        return this.store.filter('instance', function (instance) {
            return instance.get("car.id") == self.get("id");
        });
    }.property(),
    relInstance:function(){
        return this.get("relInstances").findProperty("is_finished",false);
    }.property("relInstances.length"),
    // currentStepBinding:"relInstance.lastTrace.step",
    // relUserBinding:"relInstance.inbox_user",
    numberDidChange:function(){
        var number = this.get("number");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(number)){
                this.get('errors').add('number', '不能为空');
            }
            else if(number.length > 20){
                this.get('errors').add('number', '长度不能超过20字符');
            }
            else{
                var curId = this.get("id");
                var isRepeated = this.store.peekAll('car').filter(function (car) {
                    return car.get("id") != curId && car.get("number") == number;
                }).length > 0;
                if(isRepeated){
                    this.get('errors').add('number', '不能重复');
                }
            }
        }
    }.observes("number"),
    testtypeDidChange:function(){
        var testtype = this.get("testtype");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(testtype)){
                this.get('errors').add('testtype', '不能为空');
            }
            else{
                this.get('errors').remove('testtype');
            }
        }
    }.observes("testtype"),
    vehicletypeDidChange:function(){
        var vehicletype = this.get("vehicletype");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(vehicletype)){
                this.get('errors').add('vehicletype', '不能为空');
            }
            else{
                this.get('errors').remove('vehicletype');
            }
        }
    }.observes("vehicletype"),
    descriptionDidChange:function(){
        var description = this.get("description");
        if(this.get("hasDirtyAttributes")){
            if(!Ember.isEmpty(description) && description.length > 200){
                this.get('errors').add('description', '长度不能超过200字符');
            }
        }
    }.observes("description")
});

Hsc.StartCarsView = Ember.View.extend({
    classNames:['start-cars','navigable-pane','collapse']
});
Hsc.CarView = Ember.View.extend({
    classNames:['start-cars-car','navigable-pane','collapse']
});

Hsc.StartCarsController = Ember.ArrayController.extend({
    errors:null,
    init:function(){
        this._super();
        this.set("searchHelp",this.get("searchHelpForNormal"));
        this.set("errors",DS.Errors.create());
    },
    needs:["application","session"],
    // sortProperties: ['modified_date'],
    // sortAscending: false,
    createdDateSorting: ['created_date:asc','id'],
    createdDateSortingDesc: ['created_date:desc','id'],
    modifiedDateSortingDesc: ['modified_date:desc'],
    pannelTitle:"车辆管理",
    helpInfo:"请选择一个车辆，只有车辆负责组的组织内用户才能创建车辆。",
    searchHelp:"",
    searchHelpForRetired:"输入车辆编号、试验类型搜索",
    searchHelpForNormal:"输入车辆编号、流转状态、试验类型、车型或所处步骤搜索",
    searchKey:"",
    filterType:"auto",
    isNewButtonNeeded:function(){
        var isFromInstances= this.get("isFromInstances");
        if(isFromInstances){
            return false;
        }
        return this.get("controllers.session.isCarOwners");
    }.property("controllers.session.isCarOwners","isFromInstances"),
    isFilterAuto:Ember.computed.equal('filterType', 'auto'),
    isFilterUnused:Ember.computed.equal('filterType', 'unused'),
    isFilterTurning:Ember.computed.equal('filterType', 'turning'),
    isFilterRetired:Ember.computed.equal('filterType', 'retired'),
    isCarOwnersDidChange:function(){
        //当当前用户从is_car_owners状态变成not is_car_owners状态时
        //其权限会发生变化，应该返回上一界面
        if(!this.get("controllers.session.isCarOwners")){
            //加next的原因是可能currentRouteName没有加载完成，造成没有goBack事件而报错
            Ember.run.next(this,function(){
                var currentRouteName = this.get("controllers.application.currentRouteName");
                if(currentRouteName == "start.cars.index"){
                    this.send("goBack");
                }
            });
        }
    }.observes("controllers.session.isCarOwners"),
    isToShowAll:false,
    topCount:20,
    pageCount:20,
    isTopButtonNeeded:function(){
        //只要列表个数超过topCount则需要切换按钮
        return this.get("allArrangedResult.length") > this.get("topCount");
    }.property("isToShowAll","allArrangedResult.length"),
    sortedCars:Ember.computed.sort('model', 'modifiedDateSortingDesc'),
    // allArrangedResult: Ember.computed.sort('filteredResult', 'modifiedDateSortingDesc'),
    allArrangedResult:function(){
        var searchKey = this.get("searchKey").toLowerCase(),
            filterType = this.get("filterType"),
            result;
        searchKey = searchKey.replace(/\\/g,"");
        var arrangedContent = this.get("sortedCars");
        if(!arrangedContent){
            return [];
        }
        if(searchKey){
            result = arrangedContent.filter(function(item){
                //ie8性能问题，把model中的relInstance搜索相关逻辑转移到这里处理
                var keys = item.get("searchKeys");
                var currentStep = item.get("relInstance.lastTrace.step");
                if(currentStep){
                    keys.push(currentStep.get("name"));
                }
                var relUser = item.get("relInstance.inbox_user");
                if(relUser){
                    keys.push(relUser.get("name"));
                }
                return keys.find(function(key){
                    return key.search(searchKey) >= 0;
                });
            });
        }
        else{
            result = arrangedContent;
        }
        switch(filterType){
            case "auto":
                break;
            case "unused":
                result = result.filterBy("status","unused");
                break;
            case "turning":
                result = result.filterBy("status","turning");
                break;
            case "retired":
                result = result.filterBy("status","retired");
                break;
        }
        return result;
    }.property("sortedCars.@each.searchKeys","searchKey","filterType"),
    arrangedResult:function(){
        var allArrangedResult = this.get("allArrangedResult"),
            isToShowAll = this.get("isToShowAll");
        if(isToShowAll){
            return allArrangedResult;
        }
        else{
            var topCount = this.get("topCount");
            return allArrangedResult.filter(function(item, index, self){
                return index < topCount;
            });
        }
    }.property("allArrangedResult","isToShowAll"),
    filterTypeDidChange:function(){
        this.set("isToShowAll",false);
    }.observes("filterType","searchKey"),
    topRunner:null,
    isFilterRetiredDidChange:function(){
        this.set("isMoreButtonNeeded",false);
        if(this.get("isFilterRetired")){
            this.set("searchHelp",this.get("searchHelpForRetired"));
        }
        else{
            this.set("searchHelp",this.get("searchHelpForNormal"));
            //当筛选条件从“退役”设置为“退役”之外的其他值的时候清除本地的退役车辆
            this.send("clearLocalRetiredCars");
        }
    }.observes("isFilterRetired"),
    isFilterRetiredOrSearchKeyDidChange:function(){
        if(this.get("isFilterRetired")){
            this.set("isLoadingTop",true);
            var searchKey = this.get("searchKey");
            var topRunner = this.get("topRunner"); 
            if(!topRunner && !searchKey){
                //第一次进入退役筛选功能
                //当筛选条件设置为“退役”或者搜索关键字改变的时候清除本地的退役车辆
                this.send("clearLocalRetiredCars");
                this.send("loadTop");
            }
            else{
                //保证连续输入searchKey值时不会连续多次从服务器中请求加载数据
                topRunner && Ember.run.cancel(topRunner);
                var runner = Ember.run.later(this,function(){
                    //当筛选条件设置为“退役”或者搜索关键字改变的时候清除本地的退役车辆
                    this.send("clearLocalRetiredCars");
                    this.send("loadTop");
                },1200);
                this.set("topRunner",runner);
            }
        }
    }.observes("isFilterRetired","searchKey"),
    isMoreButtonNeeded:false,
    isLoadingMore:false,
    isLoadingTop:false,
    createRecord:function(){
        var currentUser = this.get("controllers.session.user");
        var car = this.store.createRecord('car', {
            number: 'AAA-AAA',
            // owner: currentUser,
            // testtype: null,
            status: "unused",
            description: '',
            creater: Hsc.get("currentUser.id"),
            created_date: new Date(),
            modifier: Hsc.get("currentUser.id"),
            modified_date: new Date()
        });
        return car;
    },
    actions:{
        navigablePush:function(){
            $(".start-index.navigable-pane").navigablePush({
                targetTo:".start-cars.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-cars.navigable-pane").navigablePop({
                targetTo:".start-index.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        newRecord:function(){
            var isCarOwners = this.get("controllers.session.isCarOwners");
            if(isCarOwners){
                this.send("goNew");
            }
            else{
                Ember.warn("current user 's organization is not a car owners");
            }
        },
        toggleToShowAll:function(){
            this.toggleProperty("isToShowAll");
        },
        setFilterType:function(value){
            this.set("filterType",value);
            Ember.run.next(this,function(){
                $(".start-cars .collapse.filter-list").collapse('hide');
            });
        },
        clearLocalRetiredCars:function(){
            //清除本地退役车辆
            var store = this.store;
            var cars = store.peekAll("car").filterBy("status","retired");
            cars.forEach(function(car){
                store.unloadRecord(car);
            });
        },
        resetSearchSet:function(){
            //重置搜索相关设置
            //一定要注意先修改filterType再修改searchKey或者用beginPropertyChanges与endPropertyChanges包裹起来
            //因为如果先修改searchKey的话，要是filterType正好为retired会触发后台请求retired列表
            this.beginPropertyChanges();
            this.set("filterType","auto");
            this.set("searchKey","");
            this.set("isMoreButtonNeeded",false);
            this.set("isToShowAll",false);
            this.endPropertyChanges();
        },
        loadTop:function(){
            var topCount = this.get("topCount");
            var searchKey = this.get("searchKey");
            this.set("isMoreButtonNeeded",false);
            this.set("isLoadingTop",true);
            this.store.find('car', { 
                type: "top_retired",
                search_key: searchKey,
                count: topCount
            }).then(function(answer){
                // this.notifyPropertyChange("model");//不加这个通知就无法让sortedCars值刷新
                if(answer.toArray().length < topCount){
                    this.set("isMoreButtonNeeded",false);
                }
                else{
                    this.set("isMoreButtonNeeded",true);
                }
                Ember.run.next(this,function(){
                    this.set("isLoadingTop",false);
                });
            }.switchScope(this),function(reason){
                if(reason.errors && reason.errors.errors){
                    var errors = reason.errors.errors;
                    var recordErrors = this.get("errors");
                    Ember.keys(errors).forEach(function (key) {
                        recordErrors.add(Ember.String.underscore(key), errors[key]);
                    });
                }
                this.set("isLoadingTop",false);
            }.switchScope(this));
        },
        loadMore:function(){
            var pageCount = this.get("pageCount");
            var searchKey = this.get("searchKey");
            var lastModifiedDate = this.get("allArrangedResult.lastObject.modified_date");
            var serializedDate = Hsc.DateTransform.prototype.serialize.call(null,lastModifiedDate);
            serializedDate = "\"%@\"".fmt(serializedDate);//作为url参数一定要带引号，否则后台无法识别
            this.set("isLoadingMore",true);
            this.store.find('car', { 
                type: "more_retired",
                search_key: searchKey,
                count: pageCount,
                modified_date: serializedDate
            }).then(function(answer){
                if(answer.toArray().length < pageCount){
                    this.set("isMoreButtonNeeded",false);
                }
                else{
                    this.set("isMoreButtonNeeded",true);
                }
                Ember.run.next(this,function(){
                    this.set("isToShowAll",true);
                    this.set("isLoadingMore",false);
                });
            }.switchScope(this),function(reason){
                if(reason.errors && reason.errors.errors){
                    var errors = reason.errors.errors;
                    var recordErrors = this.get("errors");
                    Ember.keys(errors).forEach(function (key) {
                        recordErrors.add(Ember.String.underscore(key), errors[key]);
                    });
                }
                this.set("isToShowAll",true);
                this.set("isLoadingMore",false);
            }.switchScope(this));
        }
    }
});

Hsc.CarController = Ember.ObjectController.extend({
    needs:["application","session"],
    isEditing:false,
    isNew:false,
    modelName:"车辆",
    pannelTitle:"车辆详情",
    currentStateNameBinding:Ember.Binding.oneWay("model.currentState.stateName"),
    afterRecordIsDeleted:function(){
        //当记录被删除时，返回上一个界面，这里的删除包括当前用户删除及从服务器中push过来的删除
        var currentStateName = this.get("model.currentState.stateName");
        if(currentStateName == "root.deleted.saved"){
            var currentRouteName = this.get("controllers.application.currentRouteName");
            if(currentRouteName == "car.index" 
                || currentRouteName == "car.edit.index"){
                this.send("goBack");
            }
        }
    }.observes("currentStateName"),
    isNeedToShowFix:function(){
        return !(this.get("isNew") || this.get("isEditing"));
    }.property("isNew","isEditing"),
    helpInfo:"车辆有闲置、流转中及退役三种流转状态，其中退役的车辆不能新建工作单。",
    testtypes:function(){
        return this.store.filter('testtype', function (testtype) {
            return true;
        });
    }.property(),
    selectedTesttype:function(k,v){
        var model = this.get('model');
        if (v === undefined) {
            return model.get("testtype");
        } else {
            model.set('testtype', v);
            model.notifyPropertyChange("isRelationshipsChanged");
            return v;
        }
    }.property("model.testtype"),
    allVehicletypes:function(){
        var curVehicletypeId = this.get('model.vehicletype.id');
        return this.store.filter('vehicletype', function (vehicletype) {
            if(curVehicletypeId == vehicletype.get("id")){
                return true
            }
            return vehicletype.get("is_enabled");
        });
    }.property("model.vehicletype","model.vehicletype.id"),
    vehicletypes:function(){
        var allVehicletypes = this.get('allVehicletypes');
        return allVehicletypes.sortBy("name");
    }.property("allVehicletypes.length","allVehicletypes.@each.name"),
    selectedVehicletype:function(k,v){
        var model = this.get('model');
        if (v === undefined) {
            return model.get("vehicletype");
        } else {
            model.set('vehicletype', v);
            model.notifyPropertyChange("isRelationshipsChanged");
            return v;
        }
    }.property("model.vehicletype"),
    owners:function(){
        var model = this.get('model'),
            store = this.store;
        return store.filter('user', function (user) {
            return user.getIsCarOwners();
        });
    }.property(),
    selectedOwner:function(k,v){
        var model = this.get('model');
        if(!model){
            return;
        }
        if (v === undefined) {
            return model.get("owner");
        } else {
            model.set('owner', v);
            model.notifyPropertyChange("isRelationshipsChanged");
            return v;
        }
    }.property("model.owner"),
    createInstance:function(){
        
        this.store.beginPropertyChanges();
        var now = new Date(),
            nowStr = now.format("yyyy-MM-dd hh:mm:ss"),
            currentUser = this.get("controllers.session.user");
        var flow = this.store.peekAll("flow").get("firstObject");
        var flowversion = this.store.peekAll("flowversion").findBy("is_current",true);
        var startStep = this.store.peekAll("step").findBy("type","start");
        var car = this.get("model");
        var next_step = startStep,
            next_organization = next_step.get("organization"),
            next_yellow_timeout = next_step.get("yellow_timeout"),
            next_red_timeout = next_step.get("red_timeout"),
            next_color = next_step.get("color");
        //模拟服务器端新建instance
        var nextInstance = this.store.createRecord("instance",{
            name: car.get("number") + nowStr.replace("-","").replace(":","").replace(" ",""),
            car: car,
            testtype: car.get("testtype"),
            is_started: false,
            is_finished: false,
            is_abort: false,
            flow: flow,
            flowversion: flowversion,
            inbox_organization: next_organization,
            // outbox_users: DS.attr('string'),
            creater: currentUser,
            created_date: nowStr,
            modifier: currentUser,
            modified_date: nowStr
        });
        //模拟服务器端新建步骤的trace信息
        var nextTrace = this.store.createRecord("trace",{
            instance: nextInstance,
            previous_trace:null,
            car: car,
            step: next_step,
            organization: next_organization,
            // next_step: null,
            // next_organization: null,
            // next_workshop: null,
            start_date: nowStr,
            end_date: null,
            is_finished: false,
            yellow_due: next_yellow_timeout ? now.addMinutes(next_yellow_timeout).format("yyyy-MM-dd hh:mm:ss") : null,
            red_due: next_red_timeout ? now.addMinutes(next_red_timeout).format("yyyy-MM-dd hh:mm:ss") : null,
            color: next_color,
            info: '',
            handler: null,
            creater: currentUser,
            created_date: nowStr,
            modifier: currentUser,
            modified_date: nowStr
        });
        //模拟服务器端新建car信息
        // car.set("status","turning");


        //保存到服务器
        // nextInstance.save();
        nextInstance.save().then(function(model){
            
            //因为instance的modified_date属性变更会造成其lastTrace等计算属性立刻执行，
            //所以需要通过beginPropertyChanges、endPropertyChanges来缓存属性变更
            model.store.endPropertyChanges();
        },function(){

        });
        nextTrace.save();
        // car.save();//这里如果执行save会有问题
        
        // car.save().then(function(model){
        //     
        //     //因为instance的modified_date属性变更会造成其lastTrace等计算属性立刻执行，
        //     //所以需要通过beginPropertyChanges、endPropertyChanges来缓存属性变更
        //     model.store.endPropertyChanges();
        // },function(){

        // });
    },
    // selectedTesttypeBinding:"testtype",
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-cars.navigable-pane").navigablePush({
                targetTo:".start-cars-car.navigable-pane",
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
            $(".start-cars-car.navigable-pane").navigablePop({
                targetTo:".start-cars.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        startTurn: function () {
            this.send("goNewinstance");
        },
        abortTurn: function () {
            this.send("goAbortinstance");
        },
        edit: function () {
            this.send("goEdit");
        },
        save:function(){
            var isNew = this.get("isNew");
            this.get('model').save().then(function(answer){
                if(isNew){
                    this.send("goBack");
                }
                else{
                    this.send("goIndex");
                }
            }.switchScope(this), function(reason){
            }.switchScope(this));
        },
        cancel:function(){
            if(this.get("isNew")){
                this.send("goBack");
            }
            else{
                this.send("goIndex");
            }
        },
        deleteRecord:function(){
            this.get("model").deleteRecord();
            this.get("model").save().then(function(answer){
            }.switchScope(this), function(reason){
            }.switchScope(this));
        }
    }
});
