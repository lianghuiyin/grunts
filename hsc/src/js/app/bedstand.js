Hsc.StartBedstandsRoute = Ember.Route.extend({
    renderTemplate: function(controller) {
        this.render({ outlet: 'bedstands' });
    },
    beforeModel: function(transition) {
        // var sessionController = this.controllerFor("session");
        // return sessionController.checkIsBedstandOwners(transition);
    },
    model: function () {
        return this.store.peekAll('bedstand');
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
            controller.send("clearLocalRetiredBedstands");
            controller.send("resetSearchSet");
        });
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.index');
        },
        goDetail:function(bedstand){
            if(this.controller.get("isSorting")){
                return;
            }
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('bedstand',bedstand);
        },
        goNew:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.bedstands.new');
            Ember.run.next(this,function(){
                //新建台架需要清除之前的搜索项，这样当新建成功并返回列表可以直接看到刚新建的台架在第一条
                var controller = this.get("controller");
                controller.send("clearLocalRetiredBedstands");
                controller.send("resetSearchSet");
            });
        },
        sortUp:function(bedstand_id){
            this.controller.send("sortBedstand",bedstand_id);
        },
        sortDown:function(bedstand_id){
            this.controller.send("sortBedstand",bedstand_id,true);
        }
    }
});
Hsc.StartBedstandsNewRoute = Ember.Route.extend({
    controllerName: 'bedstand',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",true);
        controller.set("pannelTitle",Hsc.get("newModelTag").fmt(controller.get("modelName")));
        this.render('bedstand', {outlet: 'bedstand',controller: controller});
    },
    beforeModel: function() {
    },
    model:function(){
        return this.controllerFor("start_bedstands").createRecord();
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("bedstand");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("bedstand");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.bedstands');
        }
    }
});
Hsc.BedstandRoute = Ember.Route.extend({
    controllerName: 'bedstand',
    model:function(params){
        var curId = params.bedstand_id;
        var bedstand = this.store.peekRecord('bedstand', curId);
        if(!bedstand && curId.indexOf("fixture") == 0){
            //如果没有找到记录，并且是fixture开头的新记录则创建一个新记录来匹配
            return this.controllerFor("start_bedstands").createRecord();
        }
        else{
            //注意，这里如果没有找到记录，并且不是fixture开头的新记录，将返回null
            return bedstand;
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
            var controller = this.controllerFor("bedstand");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("bedstand");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.bedstands');
        }
    }
});
Hsc.BedstandIndexRoute = Ember.Route.extend({
    controllerName: 'bedstand',
    renderTemplate: function(controller) {
        controller.set("isEditing",false);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("detailModelTag").fmt(controller.get("modelName")));
        this.render('bedstand',{ outlet: 'bedstand',controller: controller });
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        //在这个路由中可能出现删除失败的情况，所以也需要回滚
        var controller = this.controllerFor("bedstand");
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
            this.transitionTo('bedstand.edit');
        },
        goNewinstance:function(){
            this.transitionTo('bedstand.newinstance');
        },
        goAbortinstance:function(){
            this.transitionTo('bedstand.abortinstance');
        },
        goRetire:function(){
            this.transitionTo('bedstand.retire');
        },
        goRestore:function(){
            this.transitionTo('bedstand.restore');
        }
    }
});
Hsc.BedstandEditRoute = Ember.Route.extend({
    controllerName: 'bedstand',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("editModelTag").fmt(controller.get("modelName")));
        this.render('bedstand', {outlet: 'bedstand',controller: controller});
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        var controller = this.controllerFor("bedstand");
        controller.set("isCreatingTag",false);
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
            this.transitionTo('bedstand.index');
        },
    }
});

Hsc.Bedstand = DS.Model.extend({
    name: DS.attr('string'),
    nickname: DS.attr('string', {defaultValue: ''}),
    organization: DS.belongsTo('organization'),
    status: DS.attr('string', {defaultValue: "unused"}),//闲置（unused）、流转中（turning）、退役（retired）
    running_state: DS.attr('string', {defaultValue: "waiting"}),//waiting（待样）、running（运行）、repairing（检修）
    tag: DS.attr('string',{defaultValue: ""}),
    description: DS.attr('string',{defaultValue: ""}),
    sort: DS.attr('number',{defaultValue: 0}),
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
        var keys = [this.get("name").toLowerCase(),
            statusName.toLowerCase()];
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
    }.property("name","status"),
    isRunning:function(){
        return this.get("running_state") == "running";
    }.property("running_state"),
    runningStateBgColor:function(){
        var running_state = this.get("running_state"),reValue = "";
        switch(running_state){
            case "waiting":
                reValue = "bg-yellow"; 
                break;
            case "running":
                reValue = "bg-green";
                break;
            case "repairing":
                reValue = "bg-gray";
                break;
            case "rating":
                reValue = "bg-gray";
                break;
            case "upkeeping":
                reValue = "bg-gray";
                break;
        }
        return reValue;
    }.property("running_state"),
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
            return instance.get("bedstand.id") == self.get("id") && instance.get("is_bedstand");
        });
    }.property(),
    relInstance:function(){
        return this.get("relInstances").findProperty("is_finished",false);
    }.property("relInstances.length"),
    nameDidChange:function(){
        var name = this.get("name");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(name)){
                this.get('errors').add('name', '不能为空');
            }
            else if(name.length > 20){
                this.get('errors').add('name', '长度不能超过20字符');
            }
            else{
                var curId = this.get("id");
                var isRepeated = this.store.peekAll('bedstand').filter(function (bedstand) {
                    return bedstand.get("id") != curId && bedstand.get("name") == name;
                }).length > 0;
                if(isRepeated){
                    this.get('errors').add('name', '不能重复');
                }

            }
        }
    }.observes("name"),
    organizationDidChange:function(){
        var organization = this.get("organization");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(organization)){
                this.get('errors').add('organization', '不能为空');
            }
            else{
                this.get('errors').remove('organization');
            }
        }
    }.observes("organization"),
    descriptionDidChange:function(){
        var description = this.get("description");
        if(this.get("hasDirtyAttributes")){
            if(!Ember.isEmpty(description) && description.length > 200){
                this.get('errors').add('description', '长度不能超过200字符');
            }
        }
    }.observes("description"),
    descriptionHtml: function(){
        return this.get("description").replace(/\n/g,"<br/>");
    }.property("description")
});

Hsc.StartBedstandsView = Ember.View.extend({
    classNames:['start-bedstands','navigable-pane','collapse']
});
Hsc.BedstandView = Ember.View.extend({
    classNames:['start-bedstands-bedstand','navigable-pane','collapse']
});

Hsc.StartBedstandsController = Ember.ArrayController.extend({
    errors:null,
    init:function(){
        this._super();
        this.set("searchHelp",this.get("searchHelpForNormal"));
        this.set("errors",DS.Errors.create());
    },
    needs:["application","session"],
    // sortProperties: ['created_date','id'],
    // sortAscending: true,
    sortSorting: ['sort:asc','created_date:asc'],
    pannelTitle:"台架管理",
    helpInfo:"请选择一个台架。",
    // helpInfo:"请选择一个台架，只有台架负责组的组织内用户才能创建台架。",
    searchHelp:"",
    searchHelpForRetired:"输入台架名称搜索",
    searchHelpForNormal:"输入台架名称、流转状态或所处步骤搜索",
    searchKey:"",
    filterType:"auto",
    isNewButtonNeeded:function(){
        var isFromInstances= this.get("isFromInstances");
        if(isFromInstances){
            return false;
        }
        return this.get("controllers.session.isBedstandOwners");
    }.property("controllers.session.isBedstandOwners","isFromInstances"),
    isFilterAuto:Ember.computed.equal('filterType', 'auto'),
    isFilterUnused:Ember.computed.equal('filterType', 'unused'),
    isFilterTurning:Ember.computed.equal('filterType', 'turning'),
    isFilterRetired:Ember.computed.equal('filterType', 'retired'),
    isBedstandOwnersDidChange:function(){
        //当当前用户从is_bedstand_owners状态变成not is_bedstand_owners状态时
        //其权限会发生变化，应该返回上一界面
        if(!this.get("controllers.session.isBedstandOwners")){
            //加next的原因是可能currentRouteName没有加载完成，造成没有goBack事件而报错
            Ember.run.next(this,function(){
                var currentRouteName = this.get("controllers.application.currentRouteName");
                if(currentRouteName == "start.bedstands.index"){
                    this.send("goBack");
                }
            });
        }
    }.observes("controllers.session.isBedstandOwners"),
    arrangedResult: Ember.computed.sort('filteredResult', 'sortSorting'),
    filteredResult:function(){
        var user = this.get("controllers.session.user");
        if(!user){
            return [];
        }
        var searchKey = this.get("searchKey").toLowerCase(),
            filterType = this.get("filterType"),
            result;
        searchKey = searchKey.replace(/\\/g,"");//不支持特殊字符\，因为会报错
        if(searchKey){
            result = this.get("model").filter(function(item){
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
            result = this.get("model");
        }
        switch(filterType){
            case "auto":
                result = result.filter(function(n){
                    return n.get("status") != "retired";
                });
                break;
            case "unused":
                result = result.filterProperty("status","unused");
                break;
            case "turning":
                result = result.filterProperty("status","turning");
                break;
            case "retired":
                result = result.filterProperty("status","retired");
                break;
        }
        var isBedstandOwners = this.get("controllers.session.isBedstandOwners");
        if(user && !isBedstandOwners){
            var orgs = user.get("organizations");
            result = result.filter(function(item,index,array){
                if(orgs.contains(item.get("organization"))){
                    return true;
                }
                else{
                    return false;
                }
            });
        }
        return result;
    }.property("arrangedContent.@each.searchKeys",
        "relInstance.lastTrace.step.name",
        "relInstance.inbox_user.name",
        "searchKey","filterType","controllers.session.isBedstandOwners",
        "controllers.session.user.organizations",
        "arrangedContent.@each.organization","arrangedContent.length"),
    isFilterRetiredDidChange:function(){
        if(this.get("isFilterRetired")){
            this.set("searchHelp",this.get("searchHelpForRetired"));
        }
        else{
            this.set("searchHelp",this.get("searchHelpForNormal"));
            //当筛选条件从“退役”设置为“退役”之外的其他值的时候清除本地的退役台架
            this.send("clearLocalRetiredBedstands");
        }
    }.observes("isFilterRetired"),
    retiredRunner:null,
    isFilterRetiredOrSearchKeyDidChange:function(){
        if(this.get("isFilterRetired")){
            this.set("isLoadingRetired",true);
            var searchKey = this.get("searchKey");
            var retiredRunner = this.get("retiredRunner"); 
            if(!retiredRunner && !searchKey){
                //第一次进入退役筛选功能
                //当筛选条件设置为“退役”或者搜索关键字改变的时候清除本地的退役台架
                this.send("clearLocalRetiredBedstands");
                // this.send("loadRetired");
            }
            else{
                //保证连续输入searchKey值时不会连续多次从服务器中请求加载数据
                retiredRunner && Ember.run.cancel(retiredRunner);
                var runner = Ember.run.later(this,function(){
                    //当筛选条件设置为“退役”或者搜索关键字改变的时候清除本地的退役台架
                    this.send("clearLocalRetiredBedstands");
                    // this.send("loadRetired");
                },1200);
                this.set("retiredRunner",runner);
            }
        }
    }.observes("isFilterRetired","searchKey"),
    isLoadingRetired:false,
    createRecord:function(){
        var bedstand = this.store.createRecord('bedstand', {
            name: '新台架',
            status: "unused",
            description:'',
            creater: Hsc.get("currentUser.id"),
            created_date: new Date(),
            modifier: Hsc.get("currentUser.id"),
            modified_date: new Date()
        });
        return bedstand;
    },
    actions:{
        navigablePush:function(){
            var from = ".start-index.navigable-pane",
                to = ".start-bedstands.navigable-pane";
            $(from).navigablePush({
                targetTo:to,
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            var to = ".start-index.navigable-pane",
                from = ".start-bedstands.navigable-pane";
            $(from).navigablePop({
                targetTo:to,
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        newRecord:function(){
            var isBedstandOwners = this.get("controllers.session.isBedstandOwners");
            if(isBedstandOwners){
                this.send("goNew");
            }
            else{
                Ember.warn("current user 's organization is not a bedstand owners");
            }
        },
        setFilterType:function(value){
            this.set("filterType",value);
            Ember.run.next(this,function(){
                $(".start-bedstands .collapse.filter-list").collapse('hide');
            });
        },
        clearLocalRetiredBedstands:function(){
            //清除本地退役台架
            // var store = this.store;
            // var bedstands = store.peekAll("bedstand").filterBy("status","retired");
            // bedstands.forEach(function(bedstand){
            //     store.unloadRecord(bedstand);
            // });
        },
        resetSearchSet:function(){
            //重置搜索相关设置
            //一定要注意先修改filterType再修改searchKey或者用beginPropertyChanges与endPropertyChanges包裹起来
            //因为如果先修改searchKey的话，要是filterType正好为retired会触发后台请求retired列表
            this.beginPropertyChanges();
            this.set("filterType","auto");
            this.set("searchKey","");
            this.endPropertyChanges();
        },
        loadRetired:function(){
            var searchKey = this.get("searchKey");
            this.set("isLoadingRetired",true);
            this.store.find('bedstand', { 
                type: "retired",
                search_key: searchKey
            }).then(function(answer){
                Ember.run.next(this,function(){
                    this.set("isLoadingRetired",false);
                });
            }.switchScope(this),function(reason){
                if(reason.errors && reason.errors.errors){
                    var errors = reason.errors.errors;
                    var recordErrors = this.get("errors");
                    Ember.keys(errors).forEach(function (key) {
                        recordErrors.add(Ember.String.underscore(key), errors[key]);
                    });
                }
                this.set("isLoadingRetired",false);
            }.switchScope(this));
        },
        unloadAllBedstandSort:function(){
            this.store.unloadAll("bedstand_sort");
        },
        sortBedstand:function(bedstand_id,isDown){
            if(!this.get("isNewButtonNeeded")){
                this.set("isSorting",true);
                this.set("isSorting",false);
                return;
            }
            var bedstandSort = this.store.createRecord("bedstand_sort",{
                bedstand_id: bedstand_id,
                is_reverse: !isDown
            });
            this.set("isSorting",true);
            bedstandSort.save(true).then(function(answer){
                this.set("isSorting",false);
                this.send("unloadAllBedstandSort");
            }.switchScope(this), function(reason){
                this.set("isSorting",false);
                this.send("unloadAllBedstandSort");
            }.switchScope(this));
        }
    }
});

Hsc.BedstandController = Ember.ObjectController.extend({
    needs:["application","session","start_bedstands"],
    isEditing:false,
    isNew:false,
    modelName:"台架",
    pannelTitle:"台架详情",
    currentStateNameBinding:Ember.Binding.oneWay("model.currentState.stateName"),
    afterRecordIsDeleted:function(){
        //当记录被删除时，返回上一个界面，这里的删除包括当前用户删除及从服务器中push过来的删除
        var currentStateName = this.get("model.currentState.stateName");
        if(currentStateName == "root.deleted.saved"){
            var currentRouteName = this.get("controllers.application.currentRouteName");
            if(currentRouteName == "bedstand.index" 
                || currentRouteName == "bedstand.edit.index"){
                this.send("goBack");
            }
        }
    }.observes("currentStateName"),
    isNeedToShowFix:function(){
        return !(this.get("isNew") || this.get("isEditing"));
    }.property("isNew","isEditing"),
    helpInfo:"台架有待样、运行、检修、标定、保养5种运行状态，标记台架本身所处工作状态；有闲置、流转中及退役三种流转状态，标记台架工作单流转状态，其中退役的台架不能新建工作单；",
    organizations:function(){
        return this.store.peekAll("organization");
    }.property(),
    selectedOrganization:function(k,v){
        var model = this.get('model');
        if (v === undefined) {
            return model.get("organization");
        } else {
            model.set('organization', v);
            model.notifyPropertyChange("isRelationshipsChanged");
            return v;
        }
    }.property("model.organization"),
    isCreatingTag:false,
    newTag:"",
    allTagValues:function(){
        // return this.get("controllers.start_bedstands").mapBy("tag").uniq().removeObject("");
        return this.store.peekAll("bedstand").mapBy("tag").uniq().removeObject("");
    }.property("controllers.start_bedstands","newTag","model.tag"),
    tags:function(){
        var allTagValues = this.get("allTagValues").sort();
        return allTagValues.map(function(item,index){
            return {value:item}
        });
    }.property("allTagValues"),
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-bedstands.navigable-pane").navigablePush({
                targetTo:".start-bedstands-bedstand.navigable-pane",
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
            $(".start-bedstands-bedstand.navigable-pane").navigablePop({
                targetTo:".start-bedstands.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        setTag:function(value){
            this.get('model').set("tag",value);
        },
        clearTag:function(value){
            this.get('model').set("tag","");
            // this.set("newTag","");
        },
        saveCreatingTag:function(){
            var newTag = this.get("newTag");
            if(newTag){
                this.get('model').set("tag",newTag);
            }
            this.send("toggleCreatingTag");
        },
        toggleCreatingTag:function(value){
            this.toggleProperty("isCreatingTag");
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
                    location.reload();
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
                location.reload();
            }.switchScope(this), function(reason){
            }.switchScope(this));
        }
    }
});


Hsc.BedstandTagItemController = Ember.ObjectController.extend({
    isTagActive:function(){
        return this.get("parentController.tag") == this.get("value");
    }.property("parentController.tag")
});
