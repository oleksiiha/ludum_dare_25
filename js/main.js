(function () {
	'use strict';

	var Application, Drawer, Layer, Room, Map,
		app, assets = [];

    Layer = Backbone.View.extend({
        tagName: 'canvas',

        initialize: function () {

        },

        render: function () {
            return this;
        }
    });

    Room = Backbone.Model.extend({
        variants: [],
        initialize: function () {
            _.bindAll(this);
            _.each(this.get('variants'), this.convertRoom);
        },

        getRoom: function () {
            return _.shuffle(this.variants)[0];
        },

        convertRoom: function (variant) {
            var room = _.clone(variant);

            _.each(room.layers, function (layer, index) {
                var newData = [],
                    x = 0,
                    y = 0,
                    counter = 0;
                for (x; x < room.width; x++) {
                    for (y; y < room.height; y++) {
                        if (_.isUndefined(newData[x])) {
                            newData[x] = [];
                        }
                        newData[x][y] = layer.data[counter];
                        counter++;
                    }
                }
                room.layers[index].data = newData;
            });

            this.variants.push(room);
        }
    });

    Map = Backbone.Model.extend({

    });

	Drawer = Backbone.View.extend({
		initialize: function () {
            this.setElement($('#container'));
		},

		render: function () {
            var rooms = [], map;
            _.each(this.options.resources, function (roomVariants) {
                var room = new Room({variants: roomVariants});
                rooms.push(room.getRoom());
            });
            console.log(rooms);
            map = new Map(rooms);
			return this;
		}
	});

	Application = Backbone.Model.extend({
		initialize: function () {
			_.bindAll(this);
			var getRess  = [],
                self = this,
                room,
                roomInd,
                count = 0;
            this.resources = [];
            for (room = 1; room <= 9; room++) {
                for (roomInd = 1; roomInd <= 3; roomInd++) {
                    (function (room, roomInd) {
                        if (_.isUndefined(self.resources[room])) {
                            self.resources[room] = [];
                        }
                        getRess[count] = $.get('assets/data/room_' + room + '_' + roomInd + '.json', function (answer) { self.resources[room].push(answer); });
                        count++;
                    }(room, roomInd));
                }
            }
			$.when.apply($, getRess).done(this.resoucesReady);
		},

		resoucesReady: function () {
			console.log('<---- Resources ready!');
			this.drawer = new Drawer({resources: this.resources});
			this.drawer.render();
		}
	});

	app = new Application();

}());