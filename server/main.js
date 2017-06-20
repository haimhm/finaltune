import { Meteor } from 'meteor/meteor';
import '../imports/api/tasks.js';

Meteor.startup(() => {

});
Meteor.publish('allUsers', function() {
    return Meteor.users.find({});
})

Meteor.users.allow({
    update: function (userId, doc, fields, modifier) {
        console.log('UPDATE USER');
        return true;
    }
});