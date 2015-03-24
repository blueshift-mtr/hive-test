if (Meteor.isClient) {
    // counter starts at 0
    Session.setDefault('counter', 0);

    Template.hello.helpers({
        counter: function () {
            return Session.get('counter');
        }
    });

    Template.hello.events({
        'click button': function () {
            // increment the counter when button is clicked
            Session.set('counter', Session.get('counter') + 1);
        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}

if(Meteor.isClient) {
    Meteor.startup(function () {

        if(Meteor.userId()) {
            HiveWorker.addWorker();
        }

        console.log("Startup!");

        //Create a job schema
        HiveWorker.jobSchema("consoleTest", consoleTest);

        //Insert the job into the DB Queue
        for(var i = 0; i < 100; i++) {
            Hive.insertJob('consoleTest', { tag: "fuck you" });
        }
    });

    function consoleTest(data, callback, failureCallback) {
        Meteor.setTimeout(function() {
            console.log("Hello World!", data);
            callback && callback();
        }, 1000);
    };

    Accounts.onLogin(function() {
        //Initialize self as a worker (Start getting and processing Jobs)
        HiveWorker.addWorker();
    });
}