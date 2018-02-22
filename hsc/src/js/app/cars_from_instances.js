Hsc.StartInstancesCarsRoute = Hsc.StartCarsRoute.extend({
    controllerName: 'start.instances.cars',
    renderTemplate: function(controller) {
        this.render('start/cars', {outlet: 'instances_cars',controller: controller});
    },
    actions:{
        goBack:function(){
            Hsc.transitionAnimation = "slideHorizontal";
            this.transitionTo('start.instances.inbox');
        }
    }
});

Hsc.StartInstancesCarsController = Hsc.StartCarsController.extend({
    isFromInstances:true,
    pannelTitle:"新建车辆工作单",
    actions:{
        navigablePush:function(){
            var from = ".start-instances.navigable-pane",
                to = ".start-cars.navigable-pane";
            $(from).navigablePush({
                targetTo:to,
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        },
        navigablePop:function(){
            var to = ".start-instances.navigable-pane",
                from = ".start-cars.navigable-pane";
            $(from).navigablePop({
                targetTo:to,
                animation:Hsc.transitionAnimation
            });
            Hsc.transitionAnimation = "none";
        }
    }
});
