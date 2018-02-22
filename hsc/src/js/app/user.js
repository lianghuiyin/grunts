Hsc.UsersRoute = Ember.Route.extend({
    renderTemplate: function() {
        this.render({ outlet: 'users' });
    },
    beforeModel: function() {
        
    },
    model: function () {
        return this.store.peekAll('user');
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("users");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("users");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.setting');
        },
        goUser:function(user){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('user',user);
        },
        goNew:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('users.new');
        }
    }
});
Hsc.UsersNewRoute = Ember.Route.extend({
    controllerName: 'user',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",true);
        controller.set("pannelTitle",Hsc.get("newModelTag").fmt(controller.get("modelName")));
        this.render('user', {outlet: 'user',controller: controller});
    },
    beforeModel: function() {
    },
    model:function(){
        return this.controllerFor("users").createRecord();
    },
    afterModel: function(model, transition) {
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.controllerFor("user");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("user");
        var model = controller.get("model");
        model && model.rollbackAttributes();
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('users');
        }
    }
});
Hsc.UserRoute = Ember.Route.extend({
    controllerName: 'user',
    beforeModel: function() {
    },
    model:function(params){
        var curId = params.user_id;
        var user = this.store.peekRecord('user', curId);
        if(!user && curId.indexOf("fixture") == 0){
            //如果没有找到记录，并且是fixture开头的新记录则创建一个新记录来匹配
            return this.controllerFor("users").createRecord();
        }
        else{
            //注意，这里如果没有找到记录，并且不是fixture开头的新记录，将返回null
            return user;
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
            var controller = this.controllerFor("user");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("user");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('users');
        }
    }
});
Hsc.UserIndexRoute = Ember.Route.extend({
    controllerName: 'user',
    renderTemplate: function(controller) {
        controller.set("isEditing",false);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("detailModelTag").fmt(controller.get("modelName")));
        this.render('user',{ outlet: 'user',controller: controller });
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        //在这个路由中可能出现删除失败的情况，所以也需要回滚
        var controller = this.controllerFor("user");
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
            this.transitionTo('user.edit');
        },
        goResetpwd:function(){
            this.transitionTo('user.resetpwd');
        }
    }
});
Hsc.UserEditRoute = Ember.Route.extend({
    controllerName: 'user',
    renderTemplate: function(controller) {
        controller.set("isEditing",true);
        controller.set("isNew",false);
        controller.set("pannelTitle",Hsc.get("editModelTag").fmt(controller.get("modelName")));
        this.render('user', {outlet: 'user',controller: controller});
    },
    afterModel: function(model, transition) {
    },
    deactivate:function(){
        var controller = this.controllerFor("user");
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
            this.transitionTo('user.index');
        }
    }
});

Hsc.User = DS.Model.extend({
    name: DS.attr('string'),
    phone: DS.attr('string'),
    email: DS.attr('string'),
    password: DS.attr('string'),
    role: DS.belongsTo('role'),
    organizations: DS.hasMany('organization'),
    signature: DS.attr('string'),
    is_developer: DS.attr('boolean', {defaultValue: false}),
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
    getIsCarOwners:function(){
        var organizations = this.get("organizations");
        return organizations.isAny("is_car_owners");
    },
    getIsBedstandOwners:function(){
        var organizations = this.get("organizations");
        return organizations.isAny("is_bedstand_owners");
    },
    getIsBedstandsManger:function(){
        var organizations = this.get("organizations");
        var isBedstandOwners = organizations.isAny("is_bedstand_owners");
        if(isBedstandOwners){
            return true;
        }
        var bedstand = this.store.peekAll('bedstand').find(function(item,index,array){
            if(organizations.contains(item.get("organization"))){
                return true;
            }
            else{
                return false;
            }
        });
        return !!bedstand;
    },
    searchKeys:function(){
        if(!this.get("id")){
            return [];
        }
        var organizations = this.get("organizations");
        var orgNames = organizations ? organizations.map(function(n){
            return n.get("name");
        }).join(",") : "";
        return [this.get("name").toLowerCase(),
            this.get("phone").toLowerCase(),
            this.get("email").toLowerCase(),
            orgNames.toLowerCase()];
    }.property("name","phone","email"),
    isAdmin:function(){
        return this.get("role.id") == 1;
    }.property("role"),
    nameDidChange:function(){
        var name = this.get("name");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(name)){
                this.get('errors').add('name', '不能为空');
            }
            else if(name.length > 20){
                this.get('errors').add('name', '长度不能超过20字符');
            }
        }
    }.observes("name"),
    phoneDidChange:function(){
        var phone = this.get("phone"),
            email = this.get("email");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(phone) && Ember.isEmpty(email)){
                this.get('errors').add('phone', '手机号及邮箱至少有一个不能为空');
            }
            else{
                this.get('errors').remove('phone');
                if(this.get('errors').get("email")){
                    this.notifyPropertyChange("email");
                }
            }
            if(!Ember.isEmpty(phone) && phone.length > 20){
                this.get('errors').add('phone', '长度不能超过20字符');
            }
            else{
                var curId = this.get("id");
                var isRepeatedForPhone = this.store.peekAll('user').filter(function (user) {
                    return !Ember.isEmpty(phone) && user.get("id") != curId && user.get("phone") == phone;
                }).length > 0;
                if(isRepeatedForPhone){
                    this.get('errors').add('phone', '不能重复');
                }
            }
        }
    }.observes("phone"),
    emailDidChange:function(){
        var phone = this.get("phone"),
            email = this.get("email");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(phone) && Ember.isEmpty(email)){
                this.get('errors').add('email', '手机号及邮箱至少有一个不能为空');
            }
            else{
                this.get('errors').remove('email');
                if(this.get('errors').get("phone")){
                    this.notifyPropertyChange("phone");
                }
            }
            if(!Ember.isEmpty(email) && !HOJS.lib.valiEmailValue(email)){
                this.get('errors').add('email', '格式不正确');
            }
            else if(!Ember.isEmpty(email) && email.length > 20){
                this.get('errors').add('email', '长度不能超过20字符');
            }
            else{
                var curId = this.get("id");
                var isRepeatedForEmail = this.store.peekAll('user').filter(function (user) {
                    return !Ember.isEmpty(email) && user.get("id") != curId && user.get("email") == email;
                }).length > 0;
                if(isRepeatedForEmail){
                    this.get('errors').add('email', '不能重复');
                }
            }
        }
    }.observes("email"),
    signatureDidChange:function(){
        var signature = this.get("signature");
        if(this.get("hasDirtyAttributes")){
            if(!Ember.isEmpty(signature) && signature.length > 200){
                this.get('errors').add('signature', '长度不能超过200字符');
            }
        }
    }.observes("signature"),
    roleDidChange:function(){
        var role = this.get("role");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(role)){
                this.get('errors').add('role', '不能为空');
            }
            else{
                this.get('errors').remove('role');
            }
        }
    }.observes("role"),
    organizationsDidChange:function(){
        var organizations = this.get("organizations");
        if(this.get("hasDirtyAttributes")){
            if(Ember.isEmpty(organizations)){
                this.get('errors').add('organizations', '不能为空');
            }
            else{
                this.get('errors').remove('organizations');
            }
        }
    }.observes("organizations")
});

Hsc.UsersView = Ember.View.extend({
    classNames:['start-setting-users','navigable-pane','collapse']
});
Hsc.UserView = Ember.View.extend({
    classNames:['start-setting-users-user','navigable-pane','collapse']
});

Hsc.UsersController = Ember.ArrayController.extend({
    needs:["application"],
    // sortProperties: ['created_date','id'],
    // sortAscending: true,
    createdDateSorting: ['created_date:asc','id'],
    createdDateSortingDesc: ['created_date:desc','id'],
    modifiedDateSortingDesc: ['modified_date:desc'],
    arrangedResult: Ember.computed.sort('filteredResult', 'createdDateSorting'),
    searchKey:"",
    filteredResult:function(){
        var searchKey = this.get("searchKey").toLowerCase();
        searchKey = searchKey.replace(/\\/g,"");
        if(searchKey){
            return this.get("arrangedContent").filter(function(item){
                return item.get("searchKeys").find(function(key){
                    return key.search(searchKey) >= 0;
                });
            });
        }
        else{
            return this.get("arrangedContent");
        }
    }.property("arrangedContent.@each.searchKeys","searchKey"),
    createRecord:function(){
        var user = this.store.createRecord('user', {
            name: '新用户',
            phone: '00000000000',
            email: '',
            role:null,
            organizations:[],
            signature: '',
            creater: Hsc.get("currentUser.id"),
            created_date: new Date(),
            modifier: Hsc.get("currentUser.id"),
            modified_date: new Date()
        });
        return user;
    },
    actions:{
        navigablePush:function(){
            $(".start-setting.navigable-pane").navigablePush({
                targetTo:".start-setting-users.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".start-setting-users.navigable-pane").navigablePop({
                targetTo:".start-setting.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        newRecord:function(){
            this.send("goNew");
        }
    }
});

Hsc.UserController = Ember.ObjectController.extend({
    needs:["application"],
    isEditing:false,
    isNew:false,
    modelName:"用户",
    pannelTitle:"用户详情",
    currentStateNameBinding:Ember.Binding.oneWay("model.currentState.stateName"),
    afterRecordIsDeleted:function(){
        //当记录被删除时，返回上一个界面，这里的删除包括当前用户删除及从服务器中push过来的删除
        var currentStateName = this.get("model.currentState.stateName");
        if(currentStateName == "root.deleted.saved"){
            var currentRouteName = this.get("controllers.application.currentRouteName");
            if(currentRouteName == "user.index" 
                || currentRouteName == "user.edit.index"){
                this.send("goBack");
            }
        }
    }.observes("currentStateName"),
    isNeedToShowFix:function(){
        return !(this.get("isNew") || this.get("isEditing"));
    }.property("isNew","isEditing"),
    helpInfo:"手机号或邮箱将作为账户登录的唯一凭证。",
    roles:function(){
        return this.store.peekAll("role");
    }.property(),
    selectedRole:function(k,v){
        var model = this.get('model');
        if (v === undefined) {
            return model.get("role");
        } else {
            model.set('role', v);
            model.notifyPropertyChange("isRelationshipsChanged");
            // //纠正model的belongsTo关联属性在changedAttributes及rollback上的bug
            // this.get("model").fixChangedAttributesBugForKey("role");
            return v;
        }
    }.property("model.role"),
    allOrganizations:function(){
        return this.store.peekAll("organization");
    }.property(),
    isFiltering:false,
    clearAllFlag:false,
    // checkOrganization:function(k,v){
    //     var model = this.get('model');
    //     if (v === undefined) {
    //         return model.get("organization");
    //     } else {
    //         model.set('organization', v);
    //         //纠正model的belongsTo关联属性在changedAttributes及rollback上的bug
    //         this.get("model").fixChangedAttributesBugForKey("organization");
    //         return v;
    //     }
    // }.property("model.organization"),
    actions:{
        navigablePush:function(){
            var controller = this;
            $(".start-setting-users.navigable-pane").navigablePush({
                targetTo:".start-setting-users-user.navigable-pane",
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
            $(".start-setting-users-user.navigable-pane").navigablePop({
                targetTo:".start-setting-users.navigable-pane",
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        clearAllOrganizations: function(){
            this.get("model.organizations").clear();
            this.get("model").notifyPropertyChange("isRelationshipsChanged");
            this.notifyPropertyChange("clearAllFlag");
        },
        // checkOrganizationItem: function(item){
        //     var isChecked = !item.get("isChecked");
        //     if(isChecked){
        //         this.get("model.organizations").pushObject(item);
        //     }
        //     else{
        //         this.get("model.organizations").removeObject(item);
        //     }
        //     item.set("isChecked",isChecked);
        //     item.notifyPropertyChange("isChecked");
        //     this.get("model").fixChangedAttributesBugForKey("organizations");
        // },
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
        resetpwd:function(){
            this.send("goResetpwd");
        },
        deleteRecord:function(){
            this.get("model").deleteRecord();
            this.get("model").save().then(function(answer){
            }.switchScope(this), function(reason){
            }.switchScope(this));
        }
    }
});

Hsc.UserOrganizationsItemController = Ember.ObjectController.extend({
    organizationsBinding:Ember.Binding.oneWay("parentController.organizations"),
    isChecked:function(){
        return this.get("organizations").contains(this.get("content"));
    }.property("organizations","parentController.clearAllFlag"),
    actions:{
        checkOrganizationItem: function(item){
            var isChecked = !this.get("isChecked");
            if(isChecked){
                this.get("parentController.organizations").pushObject(item);
            }
            else{
                this.get("parentController.organizations").removeObject(item);
            }
            var parentModel = this.get("parentController.model");
            parentModel.set("organizations",parentModel.get("organizations").sortBy("created_date"));
            this.notifyPropertyChange("isChecked");
            this.get("parentController.model").notifyPropertyChange("isRelationshipsChanged");
        }
    }

});

Hsc.User.FIXTURES = [
    {
        id: 1,
        name: '秦工',
        phone: '18704914345',
        email: 'QinShiliang@csvw.com',
        password:'hhhhhh',
        role:1,
        organization:1,
        signature: 'Take your time...',
        is_developer:true
    },
    {
        id: 2,
        name: '左工',
        phone: '12874837623',
        email: 'ZuoZongqiang@csvw.com',
        password:'hhhhhh',
        role:1,
        organization:1,
        signature: 'Take it easy...',
        is_developer:false
    },
    {
        id: 3,
        name: '殷亮辉',
        phone: '13701914323',
        email: 'lianghui_yin@163.com',
        password:'hhhhhh',
        organization:2,
        role:1,
        signature: 'hurry up',
        is_developer:true
    },
    {
        id: 4,
        name: '石破天',
        phone: '12459845678',
        email: '',
        password:'hhhhhh',
        organization:2,
        role:1,
        signature: 'hurry up',
        is_developer:false
    },
    {
        id: 5,
        name: '石大平',
        phone: '13701914323',
        email: '',
        password:'hhhhhh',
        organization:2,
        role:1,
        signature: 'hurry up',
        is_developer:false
    },
    {
        id: 6,
        name: 'steev_ai',
        phone: '16488834567',
        email: '',
        password:'hhhhhh',
        role:2,
        organization:4,
        signature: 'Take your time',
        is_developer:false
    },
    {
        id: 7,
        name: '石中玉',
        phone: '12983745684',
        email: '',
        password:'hhhhhh',
        role:2,
        organization:4,
        signature: 'Take your time',
        is_developer:false
    },
    {
        id: 8,
        name: '汤工',
        phone: '15678456272',
        email: '',
        password:'hhhhhh',
        role:3,
        organization:9,
        signature: 'put forhead',
        is_developer:true
    },
    {
        id: 9,
        name: '闵先生',
        phone: '14904935927',
        email: '',
        password:'hhhhhh',
        role:3,
        organization:9,
        signature: 'put forhead',
        is_developer:false
    },
    {
        id: 10,
        name: 'jerry',
        phone: '14567389138',
        email: '',
        password:'hhhhhh',
        role:3,
        organization:3,
        signature: 'put forhead',
        is_developer:true
    },
    {
        id: 11,
        name: 'selira',
        phone: '13456895432',
        email: '',
        password:'hhhhhh',
        role:3,
        organization:3,
        signature: 'put forhead',
        is_developer:true
    }
];
