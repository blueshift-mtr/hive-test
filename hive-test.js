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
        console.log("Startup!");
        HiveWorker.job("consoleTest", consoleTest);

        for(var i = 0; i < 1000; i++) {
            Hive.insertJob('consoleTest', { tag: "fuck you" });
        }

        HiveWorker.addWorker(function() {
        });
    });

    function consoleTest(data, callback) {
        Meteor.setTimeout(function() {
            console.log("Hello World!", data);
            callback && callback();
        }, 0);
    };
}