(function () {
	'use strict';

	var Application, Drawer,
		app;


	Drawer = Backbone.View.extend({
		initialize: function () {
            this.setElement($('#container'));
		},

		render: function () {
            console.log(this.options);
			return this;
		}
	});

	Application = Backbone.Model.extend({
		initialize: function () {
			_.bindAll(this);
			var getRess  = [],
                self = this;
            this.resources = [];
            getRess[1] = $.get(
                'assets/data/test_map.json',
                function (answer) {
                    self.resources.push(answer);
                }
            );
            getRess.push();
			$.when.apply($, getRess).done(this.resoucesReady);
		},

		resoucesReady: function () {
			console.log('<---- Resources ready!');
			this.drawer = new Drawer({resources: this.resources});
			this.drawer.render();
		}
	});

	app = new Application();

}) ();