/*!
 * Hsc v0.1.0
 * Copyright 2016 Lit.Yin
 */

window.Hsc = Ember.Application.create({
    LOG_TRANSITIONS: true,
    transitionAnimation:"none",
    newModelTag:"新增%@",
    detailModelTag:"%@详情",
    editModelTag:"修改%@信息",
    checkIsInMobile:function(){
        return $('.navbar-brand.visible-xs-inline').css("display") == "block";
    }
});

Hsc.ApplicationSerializer = DS.RESTSerializer.extend({//ActiveModelSerializer/RESTSerializer
    primaryKey:'Id',
    isNewSerializerAPI:true,
    attrs:{
        server_side_error:'ServerSideError',
        is_changeset_error:'IsChangesetError',
        err_msg_for_changeset:'ErrMsgForChangeset'
    },
    normalizeResponse: function (store, primaryModelClass, payload, id, requestType) {
        var sync_token = null;
        if(payload.is_changeset_error){
            this.extractChangesetError(payload.err_msg_for_changeset);
        }
        delete payload.is_changeset_error;
        delete payload.err_msg_for_changeset;
        if(payload.startup){
            var serializedStartup = {};
            for(var k in payload.startup){
                serializedStartup[Ember.String.underscore(k)] = payload.startup[k];
            }
            sync_token = serializedStartup.sync_token;
            delete serializedStartup.id;
            delete serializedStartup.user;
            delete serializedStartup.sync_token;
            this.extractStartup(store,serializedStartup);
        }
        else if(payload.changeset){
            var serializedChangeset = {};
            for(var k in payload.changeset){
                serializedChangeset[Ember.String.underscore(k)] = payload.changeset[k];
            }
            sync_token = serializedChangeset.sync_token;
            delete serializedChangeset.id;
            delete serializedChangeset.user;
            delete serializedChangeset.sync_token;
            var modelName = primaryModelClass.modelName;
            this.extractChangeset(
                store,
                serializedChangeset,
                modelName,
                payload[modelName] ? payload[modelName]["Id"] : null
            );
        }
        else if(payload.search){
            var serializedSearch = {};
            for(var k in payload.search){
                serializedSearch[Ember.String.underscore(k)] = payload.search[k];
            }
            delete serializedSearch.user;
            this.extractSearch(store,serializedSearch);
        }
        if(sync_token){
            this.extractSyncToken(store, sync_token);
        }
        return this._super(store, primaryModelClass, payload, id, requestType);
    },
    serialize: function(record, options) {
        return this._super(record, options);
    },
    keyForAttribute: function(attr) {
        return Ember.String.classify(attr);
    },
    keyForRelationship: function(attr) {
        return Ember.String.classify(attr);
    },
    extractMeta: function(store, type, payload) {
        if(payload&&payload.meta){
            var serializedMeta = {};
            for(var k in payload.meta){
                serializedMeta[Ember.String.underscore(k)] = payload.meta[k];
            }
            store.setMetadataFor(type,serializedMeta);
            delete payload.meta;
        }
    },
    // extract:function(store, type, payload, id, requestType){
    //     var sync_token = null;
    //     // if(payload && payload.changeset){
    //     //     var len = payload.changeset.Chips.length;
    //     //     if(len){
    //     //         console.log("chipsInChangeset:%@".fmt(len));
    //     //     }
    //     // }
    //     if(payload.is_changeset_error){
    //         this.extractChangesetError(payload.err_msg_for_changeset);
    //         delete payload.is_changeset_error;
    //         delete payload.err_msg_for_changeset;
    //     }
    //     if(payload.startup){
    //         var serializedStartup = {};
    //         for(var k in payload.startup){
    //             serializedStartup[Ember.String.underscore(k)] = payload.startup[k];
    //         }
    //         sync_token = serializedStartup.sync_token;
    //         delete serializedStartup.user;
    //         delete serializedStartup.sync_token;
    //         this.extractStartup(store,serializedStartup);
    //     }
    //     else if(payload.changeset){
    //         var serializedChangeset = {};
    //         for(var k in payload.changeset){
    //             serializedChangeset[Ember.String.underscore(k)] = payload.changeset[k];
    //         }
    //         sync_token = serializedChangeset.sync_token;
    //         delete serializedChangeset.user;
    //         delete serializedChangeset.sync_token;
    //         this.extractChangeset(
    //             store,
    //             serializedChangeset,
    //             type.typeKey,
    //             payload[type.typeKey] ? payload[type.typeKey]["Id"] : null
    //         );
    //     }
    //     else if(payload.search){
    //         var serializedSearch = {};
    //         for(var k in payload.search){
    //             serializedSearch[Ember.String.underscore(k)] = payload.search[k];
    //         }
    //         delete serializedSearch.user;
    //         this.extractSearch(store,serializedSearch);
    //     }
    //     if(sync_token){
    //         this.extractSyncToken(store, sync_token);
    //     }
    //     return this._super(store, type, payload, id, requestType);
    // },
    extractChangesetError:function(errMsg){
        console.error("There is an error for changeset fetching:%@".fmt(errMsg));
        this.container.lookup('controller:changeset').set("lastErrorToken",new Date());
    },
    extractStartup:function(store,startup){
        store.pushPayload(startup);
    },
    // extractArray:function(e,r,t){
    //     var i=this.normalizePayload(t);
    //     var n=r.typeKey;
    //     var a;
    //     for(var o in i){
    //         var s=o;
    //         var u=false;
    //         if(o.charAt(0)==="_"){
    //             u=true;s=o.substr(1)
    //         }
    //         var c=this.typeForRoot(s);
    //         if(!e.modelFactoryFor(c)){
    //             continue
    //         }
    //         var l=e.modelFor(c);
    //         var d=e.serializerFor(l);
    //         var h=!u&&l.typeKey===n;
    //         var f=Q.call(i[o],function(e){
    //             return d.normalize(l,e,o)
    //         },this);
    //         if(h){
    //             a=f
    //         }else{
    //             e.pushMany(c,f)
    //         }}
    //         return a
    // },
    extractChangeset:function(store,changeset,currentTypeKey,currentId){
        //为防止新添加的记录可能依赖已删除的记录造成的潜在问题
        //一定要先加载添加和修改的记录，然后再加载删除的记录
        // var deleteds = changeset.deleteds;
        // var serializedDeleteds = this.extractArray(store,Hsc.Deleted,changeset.deleteds);
        var deleteds = [];
        if(changeset.deleteds){
            deleteds = Ember.copy(changeset.deleteds,true);
        }
        // for(var k in deleteds){
        //     serializedDeleteds[Ember.String.underscore(k)] = deleteds[k];
        // }
        delete changeset.deleteds;
        //因为添加或修改一条记录后，后台会同时返回change及当前记录
        //当前记录如果在changeset中存在，则需要删除掉，除了优化性能外
        //更重要的是在新增记录时，如果不删除重复项的话，会出现新增了两次记录的问题
        var currentObjsByType = changeset[Ember.String.pluralize(currentTypeKey)];
        if(currentObjsByType){
            var currentObj = currentObjsByType.findBy("Id",currentId);
            if(currentObj){
                currentObjsByType.removeObject(currentObj);
            }
        }
        //根据modified_date值是否有变化判断是否记录已更新到store中，清除changeset中的重复项
        for(var key in changeset){
            var singularizeKey = key.singularize();
            var records = changeset[key];
            var tempId,tempRecord,tempModifiedDate;
            if(records.length > 0){
                changeset[key] = records.filter(function(record){
                    tempId = record["Id"];
                    tempRecord = store.peekRecord(singularizeKey,tempId);
                    if(tempRecord){
                        tempModifiedDate = record["ModifiedDate"];
                        tempModifiedDate = Hsc.DateTransform.prototype.deserialize.call(null,tempModifiedDate);
                        if(tempModifiedDate.getTime() == tempRecord.get("modified_date").getTime()){
                            return false;
                        }
                        else{
                            return true;
                        }
                    }
                    else{
                        return true;
                    }
                });
            }
        }
        store.pushPayload(changeset);//添加和修改的记录直接覆盖加载即可
        //加载删除的记录，从store中unloadRecord
        //这里要加run.next是因为不加的话，会报错，需要先unloadchangeset再执行这边的unloadRecord
        Ember.run.next(function(){
            deleteds.forEach(function(deleted){
                var model = Ember.String.underscore(deleted["Model"]),
                    targetIds = deleted["TargetIds"].split(",");
                targetIds.forEach(function(id){
                    var record = store.peekRecord(model,id);
                    if(record){
                        store.unloadRecord(record);
                    }
                });
            });
        });
    },
    extractSyncToken:function(store,sync_token){
        Hsc.set("syncToken",Hsc.DateTransform.prototype.deserialize.call(null,sync_token));
    },
    extractSearch:function(store,search){
        store.pushPayload(search);
    }
    // pushPayload:function(store, payload){
    //     var data=this.normalizePayload(payload);
    //     for(var prop in data){
    //         var type=this.typeForRoot(prop);
    //         if(!store.modelFactoryFor(type,prop)){
    //             continue
    //         }
    //         var model=store.modelFor(type);
    //         var serializer=store.serializerFor(model);
    //         var normalizeDatas = Ember.makeArray(data[prop]).map(function(item){
    //             return serializer.normalize(model,item,prop)
    //         },this);
    //         store.pushMany(type,normalizeDatas)
    //     }
    // }
});

Hsc.DateTransform = DS.Transform.extend({
    deserialize: function(serialized) {
        if(!serialized){
            return null;
        }
        if(typeof serialized == "string"){
            //"/Date(1419573609360+0800)/";
            //注意这里要把+0800去掉
            var time = serialized.match(/\d+/)[0];
            return new Date(parseInt(time));
        }
        else{
            return serialized;
        }
    },
    serialize: function(deserialized) {
        // return "/Date(1419573609360+0800)/";
        // deserialized.addMinutes(-deserialized.getTimezoneOffset());
        //这里需要拼出+0800这样的字符串，而不能用上述addMinutes函数
        //其原因是这里序列化的目标是为了给服务器使用（时区标记8小时），
        //它只是服务器的一个时区标记，而不是时间值真的添加了480分钟
        //如果这里在客户端添加8小时，当遇到服务器端执行失败的情况时就要去手动减去8小时还原。
        //所以应该在返回的服务器的字符串的处理时区问题，而不是在客户端直接处理时间值。
        if(!deserialized){
            return null;
        }
        var timezone = -deserialized.getTimezoneOffset()/60;
        return "/Date(%@+%@)/".fmt(deserialized.getTime(),timezone.toString() + "00");
    }
});

// Hsc.ApplicationSerializer = DS.ActiveModelSerializer.extend();
// Hsc.OrganizationSerializer = DS.JSONSerializer.extend();


// Hsc.ApplicationAdapter = DS.FixtureAdapter.extend({//RESTAdapter

// });



Hsc.ApplicationAdapter = DS.RESTAdapter.extend({//ActiveModelAdapter/RESTAdapter/FixtureAdapter
    namespace: 'res',
    // namespace: 'BS/res',
    shouldBackgroundReloadRecord: function () {
        return false;
    },
    // pathForType:function(type){
    //     var r=Ember.String.underscore(type);
    //     return Ember.String.pluralize(r);
    // },
    buildURL:function (type,id,record){
        var reUrls=[],host=this.get("host"),prefix=this.urlPrefix();
        if(type){
            reUrls.push(this.pathForType(type));
        }
        if(prefix){
            reUrls.unshift(prefix);
        }
        reUrls=reUrls.join("/");
        reUrls += '.ashx';
        var parems = [];
        if(record){
            if(record.get("isNew")){
                parems.push("action=post");
            }
            else if(record.get("isDeleted")){
                parems.push("action=delete");
            }
            else if(record.get("hasDirtyAttributes")){
                parems.push("action=put");
            }
        }
        else{
            parems.push("action=get");
        }
        if(id&&!Ember.isArray(id)){
            parems.push("id=%@".fmt(encodeURIComponent(id)));
        }
        if(record){
            //排除action为get的情况，所有请求不应该抓取changeset
            var serializedSyncToken = Hsc.get("serializedSyncToken");
            if(serializedSyncToken){
                serializedSyncToken = "\"%@\"".fmt(serializedSyncToken);//作为url参数一定要带引号，否则后台无法识别
                parems.push("sync_token=%@".fmt(encodeURIComponent(serializedSyncToken)));
            }
        }
        parems.push("timeTag=%@".fmt((new Date()).getTime()));
        if(parems.length){
            reUrls += "?%@".fmt(parems.join("&"));
        }
        if(!host&&reUrls){
            reUrls="/"+reUrls;
        }
        return reUrls;
    },
    ajaxOptions:function (e,r,t){
        var i=t||{};i.url=e;
        i.type=r;i.dataType="json";
        i.context=this;
        //加上async及cache属性的设置保证IE上不会出现请求不完整的失败情况
        i.async=true;
        i.cache = false;
        if(i.data&&r!=="GET"){
            // i.contentType="application/json; charset=utf-8";//这句话会让c#无法收到post数据
            // i.data=JSON.stringify(i.data);//这句话把整个data序列化成字符串了，会造成c#无法收到post数据
            var data = i.data;
            for(var k in data){
                data[k] = JSON.stringify(data[k]);
            };
            //只把data的第一层序列化成字符串
            i.data = data;
        }
        var n=this.get("headers");
        if(n!==undefined){
            i.beforeSend=function(e){
                R.call(Ember.keys(n),function(r){
                    e.setRequestHeader(r,n[r])
                });
            }
        }
        return i
    },
    ajaxSuccess:function(jqXHR, jsonPayload){
        // if(jsonPayload.errors){
        //     return new DS.InvalidError(jsonPayload.errors);
        // }
        // else{
        //     return jsonPayload;
        // }

        return jsonPayload;
    },
    fetchChangeset:function(){
        if(arguments.callee.runner){
            Ember.run.cancel(arguments.callee.runner);
        }
        arguments.callee.runner = Ember.run.later(this,function(){
            var changesetController = this.container.lookup("controller:changeset");
            if(changesetController){
                changesetController.send("tryFetch");
            }
        },2000);
    },
    ajaxError: function(jqXHR) {
        this.fetchChangeset();
        var error = this._super(jqXHR);
        if (jqXHR && jqXHR.status === 422) {
            // var jsonErrors = Ember.$.parseJSON(jqXHR.responseText);
            // return new DS.InvalidError(jsonErrors);
            var jsonErrors = Ember.$.parseJSON(jqXHR.responseText);
            return new DS.InvalidError(jsonErrors.errors);
        } else {
            return error;
        }
    },
    handleResponse: function (status, headers, payload) {
        if(status === 0){
            //status为0表示网络断开或服务器繁忙
            return new DS.InvalidError({
                ServerSideError:"网络断开或服务器繁忙"
            });
        }
        else if(status === 422){
            var errorMsg = payload.errors.ServerSideError;
            if(errorMsg){
                return new DS.InvalidError({
                    ServerSideError:errorMsg
                });
            }
            else{
                return this._super(status, headers, payload);
            }
        }
        else{
            return this._super(status, headers, payload);
        }
    },
    // createRecord:function (store, type, record) {
    //     return this._super(store, type, record);
    // },
    // deleteRecord:function (store, type, record) {
    //     var id=record.get("id");
    //     var data = {};
    //     var serializer = store.serializerFor(type.typeKey);
    //     serializer.serializeIntoHash(data, type, record, { includeId: true });
    //     return this.ajax(this.buildURL(type.typeKey,id,record),"POST", { data: data });
    // },
    // ajax:function (url, type, options) {
    //     var adapter = this;
    //     return new Ember.RSVP.Promise(function(resolve, reject) {
    //       var hash = adapter.ajaxOptions(url, type, options);

    //       hash.success = function(json, textStatus, jqXHR) {
    //         json = adapter.ajaxSuccess(jqXHR, json);
    //         // if (json instanceof DS.InvalidError) {
    //         //   Ember.run(null, reject, json);
    //         // } else {
    //         //   Ember.run(null, resolve, json);
    //         // }
    //       };

    //       hash.error = function(jqXHR, textStatus, errorThrown) {
    //         Ember.run(null, reject, adapter.ajaxError(jqXHR, jqXHR.responseText));
    //       };
    //       Ember.$.ajax(hash);
    //     }, "DS: RESTAdapter#ajax " + type + " to " + url);
    // }
});


// Hsc.FlowversionSerializer = DS.RESTSerializer.extend(DS.EmbeddedRecordsMixin, {
//   attrs: {
//     steps: {embedded: 'always'}
//   }
// });



Hsc.ApplicationRoute = Ember.Route.extend({
    beforeModel: function(transition) {
        window.document.title = this.controllerFor("application").get("appTitle");
    },
    model: function(params, transition) {
        var startupController = this.controllerFor("startup"),
            isStartupLoaded = startupController.get("isStartupLoaded");
        if(!isStartupLoaded && transition.targetName != "startup"){
            startupController.set("previousTransition",transition);
            this.transitionTo("startup");
        }
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
        goExhibitionshow:function(exhibition){
            
            this.transitionTo('exhibitionshow',exhibition);
        }
    }
});

Hsc.IndexRoute = Ember.Route.extend({
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

Hsc.ApplicationController = Ember.Controller.extend({
    needs:["session"],
    appName: 'Information System of Bench Testing Progress',
    appTitle:"EPGT台架试验进度信息管理系统",
    appShortTitle:"EPGT台架试验进度信息管理系统",
    author:"上海好耐电子科技有限公司 M&T HORIZON",
    authorSite:"http://www.mthorizon.com/",
    copyright:"版权所有 copyright 2017",
    version:"当前版本：v0.2.16",
    timeoutTag:"天",
    // mileageTag:"公里",
    isDevelopMode:true,
    isShowingExhibition:false,
    isDeveloper:function(){
        return this.get("controllers.session.user.is_developer");
    }.property("controllers.session.user.is_developer"),
    exhibitions:function(){
        //这里不可以用store.all().filterBy函数，因为那个函数不会自动更新
        return this.store.filter('exhibition', function (exhibition) {
            return true;
        });
    }.property(),
    actions:{
        logout:function(){
            var rootUrl = this.container.lookup('adapter:application').get("namespace");
            var promise = Ember.$.getJSON('/%@/logout.ashx?timeTag=%@'.fmt(rootUrl,(new Date()).getTime()));
            return promise.then(function(answer){
                this.get("controllers.session").send("logout",true);
            }.switchScope(this),function(reason){
            }.switchScope(this));
        }
    }
});


Hsc.ApplicationView = Ember.View.extend({
    templateName: 'application',
    classNames:['app-view'],
    classNameBindings:["controller.isShowingExhibition"]
});


Hsc.Router.map(function () {
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
            this.route('monitor',function(){
                this.resource('monitor.instance', { path: '/instance/:instance_id' }, function () {
                });
            });
            this.resource('start.instances.bedstands', { path: '/bedstands' },function () {
                this.route('newinstance', { path: '/:bedstand_id/newinstance' }, function () {
                });
            });
            this.resource('start.instances.cars', { path: '/cars' },function () {
            });
        });
        this.resource('start.consolewindow', { path: '/consolewindow' }, function () {
            
        });
        this.resource('start.cars', { path: '/cars' }, function () {
            this.resource('car', { path: '/car/:car_id' }, function () {
                this.route('edit',function(){
                    
                });
                this.route('newinstance',function(){
                    
                });
                this.route('abortinstance',function(){
                    
                });
                this.route('retire',function(){
                    
                });
                this.route('restore',function(){
                    
                });
            });
            this.route('new',function(){
                
            });
        });
        this.resource('start.bedstands', { path: '/bedstands' }, function () {
            this.resource('bedstand', { path: '/bedstand/:bedstand_id' }, function () {
                this.route('edit',function(){
                    
                });
                this.route('newinstance',function(){
                    
                });
                this.route('abortinstance',function(){
                    
                });
                this.route('retire',function(){
                    
                });
                this.route('restore',function(){
                    
                });
            });
            this.route('new',function(){
                
            });
        });
        this.resource('start.cartraces', { path: '/cartraces' }, function () {
            this.resource('cartrace', { path: '/cartrace/:car_id' }, function () {
            });
        });
        this.resource('start.bedstandtraces', { path: '/bedstandtraces' }, function () {
            this.resource('bedstandtrace', { path: '/bedstandtrace/:bedstand_id' }, function () {
            });
        });
        this.route('setting', function () {
            this.resource('roles', { path: '/roles' }, function () {
                this.resource('role', { path: '/role/:role_id' }, function () {
                    this.route('edit',function(){
                        
                    });
                });
                this.route('new',function(){
                    
                });
            });
            this.resource('organizations', { path: '/organizations' }, function () {
                this.resource('organization', { path: '/organization/:organization_id' }, function () {
                    this.route('edit',function(){
                        
                    });
                });
                this.route('new',function(){
                    
                });
            });
            this.resource('users', { path: '/users' }, function () {
                this.resource('user', { path: '/user/:user_id' }, function () {
                    this.route('edit',function(){
                        
                    });
                    this.route('resetpwd',function(){
                        
                    });
                });
                this.route('new',function(){
                    
                });
            });
            this.resource('workshops', { path: '/workshops' }, function () {
                this.resource('workshop', { path: '/workshop/:workshop_id' }, function () {
                    this.route('edit',function(){
                        
                    });
                });
                this.route('new',function(){
                    
                });
            });
            this.resource('vehicletypes', { path: '/vehicletypes' }, function () {
                this.resource('vehicletype', { path: '/vehicletype/:vehicletype_id' }, function () {
                    this.route('edit',function(){
                        
                    });
                });
                this.route('new',function(){
                    
                });
            });
            this.resource('testtypes', { path: '/testtypes' }, function () {
                this.resource('testtype', { path: '/testtype/:testtype_id' }, function () {
                    this.route('edit',function(){
                        
                    });
                });
                this.route('new',function(){
                    
                });
            });
            this.resource('consoles', { path: '/consoles' }, function () {
                this.resource('console', { path: '/console/:console_id' }, function () {
                    this.route('edit',function(){
                        
                    });
                });
                this.route('new',function(){
                    
                });
            });
            this.resource('flows', { path: '/flows' }, function () {
                this.resource('flow', { path: '/flow/:flow_id' }, function () {
                    this.route('edit',function(){

                    });
                    this.resource('flowversion', { path: '/flowversion/:flowversion_id' },function(){
                        this.route('edit',function(){

                        });
                    });
                });
                this.route('new',function(){
                    
                });
            });
            this.resource('exhibitions', { path: '/exhibitions' }, function () {
                this.resource('exhibition', { path: '/exhibition/:exhibition_id' }, function () {
                    this.route('edit',function(){
                        
                    });
                });
                this.route('new',function(){
                    
                });
            });
        });
    });
    this.route('about');
    this.route('contact');
    this.resource('exhibitionshow',{ path: '/exhibitionshow/:exhibitionshow_id' },function(){
    });
    this.route('account',function(){
        this.route('accountinfo',function(){
            this.route('edit',function(){
                
            });
        });
        this.route('accountpwd',function(){
        });
    });
    this.resource('testtypestable',function(){
    });
    this.resource('bedstandstable',function(){
        this.route('tag', { path: '/tag/:tag' }, function () {
        });
    });
    this.resource('picturesshow',function(){
    });
});


Hsc.LoadingView = Ember.View.extend({
  templateName: 'loading',
  classNames: 'loading'
});

Hsc.SpinButtonComponent = Ember.Component.extend({
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



