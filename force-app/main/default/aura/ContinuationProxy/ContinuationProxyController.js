({
    doInit: function (component, event, helper) {
        component.invocationCounter = 0;
        component.invocationCallbacks = {};

        var action = component.get("c.getVFBaseURL");
        action.setStorable();
        action.setCallback(this, function (response) {
            var vfBaseURL = response.getReturnValue();
            component.set("v.vfBaseURL", vfBaseURL);
            var topic = component.get("v.topic");
            window.addEventListener("message", function (event) {
                if (event.origin !== vfBaseURL) {
                    // Not the expected origin: reject message
                    return;
                }
                // Only handle messages we are interested in
                if (event.data.topic === topic) {
                    // Retrieve the callback for the specified invocation id
                    var callback = component.invocationCallbacks[event.data.invocationId];
                    callback(event.data.result);
                    delete component.invocationCallbacks[event.data.invocationId];
                }
            }, false);
        });
        $A.enqueueAction(action);
    },

    doInvoke: function (component, event, helper) {
        var vfBaseURL = component.get("v.vfBaseURL");
        var topic = component.get("v.topic");
        var args = event.getParam('arguments');
        component.invocationCounter = component.invocationCounter + 1;
        component.invocationCallbacks[component.invocationCounter] = args.callback;
        var message = {
            topic: topic,
            invocationId: component.invocationCounter,
            methodName: args.methodName,
            methodParams: args.methodParams
        };
        var vf = component.find("vfFrame").getElement().contentWindow;
        vf.postMessage(message, vfBaseURL);
    }

})