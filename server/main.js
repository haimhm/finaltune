import { Meteor } from 'meteor/meteor';
import '../imports/api/tasks.js';

Meteor.startup(() => {

});
Meteor.publish('allUsers', function() {
    return Meteor.users.find({});
})

Meteor.users.allow({
    update: function (userId, doc, fields, modifier) {
        console.log(doc.username);
        console.log(doc.song_name);
	console.log('------------------');
        return true;
    }
});
