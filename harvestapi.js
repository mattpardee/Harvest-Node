var sys  = require('sys'),
    rest = require('./res/restler/lib/restler.js');

HarvestREST = rest.service(
	function(u, p) {
		this.defaults.username = u;
		this.defaults.password = p;
	}
	, {}
	, {
		runOp: function(type, url, data) {
			data.headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
			switch(type) {
				case 'get':
					return this.get(url, data);
					break;
					
				case 'post':
					return this.post(url, data);
					break;
					
				case 'put':
					return this.put(url, data);
					break;
					
				case 'delete':
					return this.del(url, data);
					break;
			}
		}
	}
);

var Harvest = this.Harvest = function(username, password, harvest_subdomain) {
	this.client = new HarvestREST(username, password);
	this.client.baseURL = 'http://' + harvest_subdomain + '.harvestapp.com';
	
	this.procResults = function(res, cb) {
		res.addListener('success', function(data) {
			cb('success', data);
		}).addListener('error', function(data) {
			cb('error', data);
		});
	};
	
	this.getDaily = function(day, year, cb) {
		turl = '/daily';
		if(typeof day !== "function") {
			turl += '/' + day + '/' + year;
		}
		
		else {
			cb = day;
		}
		
		this.procResults(this.client.runOp('get', turl, {}), cb);
	};
	
	this.toggleTimer = function(entry_id, cb) {
		this.procResults(this.client.runOp('get', '/daily/timer/' + entry_id, {}), cb);
	};
};

var _exports = { Harvest: Harvest };