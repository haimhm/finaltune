import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

//BlazeLayout.render('mainTemplate', { main: 'bla' });

FlowRouter.route('/bla2', {
    name: 'bla2',
    action() {
        BlazeLayout.render('mainTemplate', {main: 'bla2'});
    }
});

FlowRouter.route('/:_id', {
    name: 'user_page',
    action(params, queryParams) {
        BlazeLayout.render('mainTemplate', {main: 'user_page', _params: params});
    }
});

FlowRouter.route('/', {
    name: 'bla',
    action() {
        BlazeLayout.render('mainTemplate', {main: 'bla'});
    }
});


Template.bla.helpers({
    all_users() {
        return Meteor.users.find();
        // return Template.instance().posts();
    },
});

Template.bla.onCreated(function () {
    Meteor.subscribe('allUsers');
});

Template.user_page.onCreated(function () {
    route = FlowRouter.current();
    // self.userId = route.params._id;
    this.data.dict = new ReactiveDict();
    this.data.userId = route.params._id;
    // this.data.current_user = Meteor.users.findOne({_id: route.params._id});
    // this.data.haim = 'asdasdas'
});

Template.user_page.onRendered(function () {
    let self = this;
    route = FlowRouter.current();

    // this.data.current_user = Meteor.users.findOne({_id: route.params._id});
    // this.data.haim = 'asdasdas'


    // You can use an autorun function that will rerun when the data is ready
    self.autorun(function() {
        self.data.dict.set('current_user' , Meteor.users.findOne({_id: route.params._id}));
    });
});

Template.user_page.helpers({
    current_user:function () {
        const route = FlowRouter.current();
        return Meteor.users.findOne({_id: route.params._id});
    },
    get_user_name(id) {
        // console.log("id:", id)
        Template.instance().data.current_user = Meteor.users.findOne({_id: id});
        return Template.instance().data.current_user.username;
    },
    get_user_playing(id){
        return Meteor.users.findOne({_id: id}).currently_playing;
    },
    check_current_user(){
        return Meteor.userId() == Template.instance().data.userId;
    },
    get_playlist(){
        const route = FlowRouter.current();
        return Meteor.users.findOne({_id: route.params._id}).playlist;
    },
    init(){
        gapi.client.setApiKey('AIzaSyBDDItQMbwlcF6q2bcZKKOyoISQxuhUk4Q');
        gapi.client.load('youtube', 'v3', function(){
            console.log('youtube loaded');
        });
    },
    get_next_song(){
        const route = FlowRouter.current();
        const playlist = Meteor.users.findOne({_id: route.params._id}).playlist;
        var index = playlist.indexOf(Template.instance().data.current_user.song_id);
        if (index > 0){
            return playlist[(index + 1) % playlist.length]
        } else {
            return playlist[0];
        }
    },
    get_playlist_ids(){
        const route = FlowRouter.current();
        const playlist = Meteor.users.findOne({_id: route.params._id}).playlist;
        return playlist.map(function(p){return p.song_id}).join(',');
    }
});
Template.user_page.events({
    'click .like'(){
        if ($(event.target).attr('src') == 'empty_heart.png')
            $(event.target).attr('src', 'heart.png');
        else
            $(event.target).attr('src', 'empty_heart.png');

    },
    'click #change_btn'() {
        // Set the checked property to the opposite of its current value
        Meteor.users.update({ _id: Template.instance().data.userId }, {
            $set:{
                song_id: document.getElementById('change_song').value,
            }
        });
    },
    'click #search-button' () {
        var q = $('#query').val();
        var request = gapi.client.youtube.search.list({
            type: 'video',
            q: q,
            part: 'snippet',
            maxResults: 5
        });
        request.execute(function(response) {
            var options_str = '<li></li>';
            response.items.forEach(function(item){
                options_str +=
                    '<li style="class="song_li" song_id="'+item.id.videoId+'" song_name="'+item.snippet.title+'">' +
                        '<div style="display: inline-block">' +
                            '<img src="'+item.snippet.thumbnails.default.url+'"/>' +
                        '</div>' +
                        '<div style="display: inline-block; position: relative;top: -40px; font-size:large; padding: 10px;max-width: 325px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">' +
                                item.snippet.title +
                        '</div>' +
                        '<br/>' +
                        '<button class="add_to_playlist">Add to playlist</button>&nbsp;' +
                        '<button class="play">Play</button>' +
                    '</li>';
            });
            $('#search-container').html('<br/><ul>' + options_str + '</ul>');
        });
    },
    'click .play' (){
        Meteor.users.update({ _id: Meteor.userId() }, {
            $set:{
                song_id: $(event.target).parent('li').attr('song_id'),
                song_name: $(event.target).parent('li').attr('song_name'),
            }
        });
    },
    'click .add_to_playlist' (){
        Meteor.users.update({ _id: Meteor.userId() },
            {
                $addToSet: {
                                playlist: {
                                    song_id: $(event.target).parent('li').attr('song_id'),
                                    song_name: $(event.target).parent('li').attr('song_name')
                                }
                           }
            }
        );
    },
    'click .play_from_playlist'(){
        Meteor.users.update({ _id: Meteor.userId() },
            {
                $set:{
                    song_id: $(event.target).attr('song_id'),
                    song_name: $(event.target).attr('song_name'),
                }
            }
        );
    },
    'click .remove_from_playlist'(event){
        Meteor.users.update({ _id: Meteor.userId() },
            {
                $pull: {
                    playlist: {
                        song_id: $(event.target).attr('song_id'),
                        song_name: $(event.target).attr('song_name')
                    }
                }
            }
        );
        event.stopPropagation();
    },
    'keyup #query'(){
        if (event.keyCode == 13){
            var q = $('#query').val();
            var request = gapi.client.youtube.search.list({
                type: 'video',
                q: q,
                part: 'snippet',
                maxResults: 5
            });
            request.execute(function(response) {
                var options_str = '<li></li>';
                response.items.forEach(function(item){
                    options_str +=
                        '<li style="class="song_li" song_id="'+item.id.videoId+'" song_name="'+item.snippet.title+'">' +
                            '<div style="display: inline-block">' +
                                '<img src="'+item.snippet.thumbnails.default.url+'"/>' +
                            '</div>' +
                            '<div style="display: inline-block; position: relative;top: -40px; font-size:large; padding: 10px;max-width: 325px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">' +
                                item.snippet.title +
                            '</div>' +
                            '<br/>' +
                            '<button class="add_to_playlist">Add to playlist</button>&nbsp;' +
                            '<button class="play">Play</button>' +
                        '</li>';
                });
                $('#search-container').html('<br/><ul>' + options_str + '</ul>');
            });
        }
        else{
            return;
        }

    }
});
// // import { FlowRouter } from 'meteor/kadira:flow-router';
// // import { BlazeLayout } from 'meteor/kadira:blaze-layout';

//
// import '../imports/ui/body.js';
//
// // FlowRouter.route('/', {
// //     name: 'home',
// //     action() {
// //         BlazeLayout.render('HomeLayout');
// //     }
// // });
//
// FlowRouter.route('/add_dish_par', {
//     name: 'add_dish_par',
//     action() {
//         console.log('Moving to AddDish');
//         BlazeLayout.render('App_body', {main: 'AddDish'});
//     }
// });

