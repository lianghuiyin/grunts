MobileApp.AboutDnsRoute = Ember.Route.extend({
    beforeModel: function(transition) {
    },
    model:function(params, transition){
    },
    activate:function(){
        //这里要run.next的原因是要等view加载到页面后才能执行navigablePush，即要等view.didInsertElement执行完毕
        Ember.run.next(this,function(){
            var controller = this.get("controller");
            controller.send("syncDns");
            controller.send("navigablePush");
        });
        return this;
    },
    deactivate:function(){
        var controller = this.controllerFor("about_dns");
        controller.send("navigablePop");
        return this;
    },
    actions:{
        goBack:function(){
            var controller = this.get("controller");
            controller.get("errors").clear();
            MobileApp.transitionAnimation = "slideHorizontal";
            this.transitionTo('about');
        }
    }
});

MobileApp.DnsTestFetcher = MobileApp.Model.extend({
    action:"test"
});

MobileApp.AboutDnsView = Ember.View.extend({
    classNames:['about-dns','navigable-pane','collapse','h100per']
});

MobileApp.AboutDnsController = Ember.ObjectController.extend({
    dns:"",
    isTesting:false,
    errors:DS.Errors.create(),
    actions:{
        navigablePush:function(){
            $(".about-index.navigable-pane").navigablePush({
                targetTo:".about-dns.navigable-pane",
                animation:MobileApp.transitionAnimation
            });
            MobileApp.transitionAnimation = "none";
        },
        navigablePop:function(){
            $(".about-dns.navigable-pane").navigablePop({
                targetTo:".about-index.navigable-pane",
                animation:MobileApp.transitionAnimation
            });
            MobileApp.transitionAnimation = "none";
        },
        syncDns:function(){
            this.set("dns",MobileApp.get("dns"));
        },
        test:function(callBack){
            var fetcher = MobileApp.DnsTestFetcher.create();
            this.set("isTesting",true);
            var promise = fetcher.tryPost();
            promise.then(function(result){
                this.set("isTesting",false);
                callBack(true,result);
            }.switchScope(this),function(reason){
                this.set("isTesting",false);
                callBack(false,reason);
            }.switchScope(this));
        },
        save:function(){
            this.get("errors").clear();
            var dns = this.get("dns");
            if(dns && dns.length){
                var oldDns = MobileApp.get("dns");
                MobileApp.syncDns(this.get("dns"));
                this.send("test",function(isSuc,result){
                    if(isSuc && result.get("is_passed")){
                        this.send("goBack");
                    }
                    else{
                        MobileApp.syncDns(oldDns);
                        this.get("errors").add("dns","该域名无法访问");
                    }
                }.switchScope(this));
            }
            else{
                this.get("errors").add("dns","不能为空");
            }
        },
        cancel:function(){
            this.send("goBack");
        }
	}
});