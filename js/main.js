(function () {
    'use strict';

    var Application, Drawer, Layer, Room, Map, LayerModel, Player,
        app, assets = [],
        layerTypes = ['back', 'collision', 'interactive'];

    Player = Backbone.View.extend({
        tagName: "div",
        id: "player",

        initialize: function () {
            _.bindAll(this);
            $(document).on('keydown', this.keysHandler);
        },

        render: function () {
            return this;
        },

        keysHandler: function (evt) {
            if (this.keyFlag) {
                return false;
            }
            this.keyFlag = true;
            var currentOffset = this.$el.offset(),
                x = currentOffset.left,
                y = currentOffset.top,
                tileSize = 32,
                moveObj = {},
                self = this;

            switch(event.keyCode) {
                case 38: //up
                    moveObj.top = y - tileSize;
                    break;
                case 39: //right
                    moveObj.left = x + tileSize;
                    break;
                case 40: //down
                    moveObj.top = y + tileSize;
                    break;
                case 37: //left
                    moveObj.left = x - tileSize;
                    break;
                default:
                    this.keyFlag = false;
            }
            event.preventDefault();

            if (this.keyFlag) {
                this.$el.animate(moveObj, 100, 'linear', function () {
                    self.keyFlag = false;
                });
            }
        },

        move: function () {

        }
    });

    LayerModel = Backbone.Model.extend();

    Layer = Backbone.View.extend({
        tagName: 'canvas',

        initialize: function () {
            _.bindAll(this);
            console.log(this.options);
            this.ctx = this.el.getContext('2d');
            this.el.width = this.options.layerData.width * this.options.tsData[0].tilewidth;
            this.el.height = this.options.layerData.height * this.options.tsData[0].tilewidth;
            this.el.id = this.options.layerData.name;
        },

        pickTile: function (id, x, y) {
            var self = this,
                tileset,
                probts,
                actualts,
                tile = [];
            probts = _.filter(self.options.tsData, function (ts) {
                return id >= ts.firstgid;
            });

            actualts = probts[probts.length - 1];
            if (!_.isUndefined(actualts)) {
                var tw = this.options.tsData[0].tilewidth,
                    deltaid = id - actualts.firstgid,
                    imgtWidth = Math.floor(actualts.imagewidth / tw);
                tile.push(actualts.img,
                    // image offset
                    (deltaid % imgtWidth) * tw,
                    Math.floor(deltaid / imgtWidth) * tw,
                    tw,
                    tw,
                    // canvas offset
                    x * tw,
                    y * tw,
                    tw,
                    tw);
            } else {
                tile = null;
            }

            return tile;
        },

        render: function () {
            var self = this,
                data = this.options.layerData.data,
                width = data.length,
                height;

            for (var x = 0; x < width; x++) {
                height = data[x].length;
                for (var y = 0; y < height; y++) {
                    var tile = this.pickTile(data[x][y], x, y);
                    if (!_.isNull(tile)) {
                        this.ctx.drawImage.apply(self.ctx, tile);
                    }
                }
            }

            return this;
        }
    });

    Room = Backbone.Model.extend({
        initialize: function () {
            _.bindAll(this);
            this.variants = [];
            _.each(this.get('variants'), this.convertRoom);
        },

        getRoom: function () {
            return _.shuffle(this.variants)[0];
        },

        convertRoom: function (variant) {
            var room = _.clone(variant);

            _.each(room.layers, function (layer, index) {
                var newData = [],
                    counter = 0;
                for (var y = 0; y < room.height; y++) {
                    for (var x = 0; x < room.width; x++) {
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

    Map = Backbone.View.extend({
        tagName: 'div',
        id: "layers-container",
        layers: [],
        tilesets: null,

        initialize: function () {
            _.bindAll(this);

            var self = this,
                images = [];

            self.tilesets = self.options.rooms[0].tilesets;

            _.each(layerTypes, function (layerType) {
                var layer = {
                        name: layerType,
                        data: []
                    };
                _.each(self.options.rooms, function (room, index) {
                    var fragment = _.where(room.layers, {name: layerType})[0].data;
                    _.extend(layer, {
                        width: room.width * 3,
                        height: room.height * 3
                    });
                    for (var x = 0; x < room.width; x++) {
                        for (var y = 0; y < room.height; y++) {
                            var globalChankX = index % 3,
                                globalChankY = Math.floor(index / 3),
                                globalX = globalChankX * room.width + x,
                                globalY = globalChankY * room.height + y;
                            if (_.isUndefined(layer.data[globalX])) {
                                layer.data[globalX] = [];
                            }
                            layer.data[globalX][globalY] = fragment[x][y];
                        }
                    }
                });

                self.layers.push(layer);
            });

            console.log('<---- Map ready!');

            _.each(this.tilesets, function (tileset) {
                var imgLoad = new $.Deferred,
                    img = new Image(),
                    fileA = tileset.image.split(/\//),
                    fileName = fileA[fileA.length -1];

                images.push(imgLoad);
                img.onload = imgLoad.resolve;
                tileset.img = img;
                img.src = 'assets/tiles/' + fileName;
            });

            $.when.apply($, images).done(self.render);
        },

        render: function () {
            console.log('<---- Tilesets loaded');

            var self = this;

            _.each(this.layers, function(layer) {
                var layerView = new Layer({
                    layerData: layer,
                    tsData: self.tilesets
                });
                self.$el.append(layerView.render().el);
            });

            return this;
        }
    });

    Drawer = Backbone.View.extend({
        initialize: function () {
            this.setElement($('#container'));
        },

        render: function () {
            var rooms = [], map, player;
            _.each(this.options.resources, function (roomVariants) {
                var room = new Room({variants: roomVariants});
                rooms.push(room.getRoom());
            });
            map = new Map({rooms: rooms});
            this.$el.append(map.el);
            player = new Player();
            this.$el.append(player.render().el);
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
                        if (_.isUndefined(self.resources[room-1])) {
                            self.resources[room-1] = [];
                        }
                        var fileIndex = room + '_' + roomInd;
                        getRess[count] = $.get(
                            'assets/data/room_' + fileIndex + '.json',
                            function (answer) {
                                answer.fileIndex = fileIndex;
                                self.resources[room-1].push(answer);
                            }
                        );
                        count++;
                    }(room, roomInd));
                }
            }
            $.when.apply($, getRess).done(this.resoucesReady);
        },

        resoucesReady: function () {
            console.log('<---- Resources ready!', this.resources);
            this.drawer = new Drawer({resources: this.resources});
            this.drawer.render();
        }
    });

    app = new Application();

}());