var sys    = require('sys'),
    qs     = require('querystring'),
    xml2js = require('./res/node-xml2js/lib/'),
    rest   = require('./res/restler/lib/restler.js');

HarvestREST = rest.service(
	function(u, p) {
		this.defaults.username = u;
		this.defaults.password = p;
	}
	, {}
	, {
		runOp: function(type, url, data) {
			var opts = {};
			opts.headers = { 'Content-Type': 'application/xml', 'Accept': 'application/xml' };
    		if(typeof data !== 'undefined') {
        		if(typeof data === 'object') {
            	    opts.headers['Content-Length'] = qs.stringify(data).length;
                }
                
                else {
                    opts.headers['Content-Length'] = data.length;
                }
    		}
        	
            else {
                opts.headers['Content-Length'] = 0;   
            }

			opts.data = data;
			switch(type) {
				case 'get':
					return this.get(url, opts);
					break;
					
				case 'post':
					return this.post(url, opts);
					break;
					
				case 'put':
					return this.put(url, opts);
					break;
					
				case 'delete':
					return this.del(url, opts);
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
    	    // Trim the data
    	    data = data.replace(/^\s*|\s*$/, '');
    	    if(data != '') {
    	        parser = new xml2js.Parser();
                parser.addListener('end', function(result) {
                    cb('success', result);        
                });
                parser.parseString(data);
    	    }
            
            else {
                cb('success', data);   
            }
		}).addListener('error', function(data) {
			cb('error', data);
			//sys.puts(sys.inspect(res));
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
		
		this.procResults(this.client.runOp('get', turl), cb);
	};
    
    this.getSingleEntry = function(day_entry_id, cb) {
        this.procResults(this.client.runOp('get', '/daily/show/' + day_entry_id), cb);
    };
	
	this.toggleTimer = function(entry_id, cb) {
		this.procResults(this.client.runOp('get', '/daily/timer/' + entry_id), cb);
	};
	
	this.newDailyEntry = function(project_id, task_id, date_logging, notes, hours, cb) {
        xmlstr = '<request><notes>' + notes + '</notes><hours>' + hours 
                    + '</hours><project_id type="integer">' + project_id
                    + '</project_id><task_id type="integer">' + task_id + '</task_id>'
                    + '<spent_at type="date">' + date_logging + '</spent_at>'
                    + '</request>';
		this.procResults(
			this.client.runOp('post', '/daily/add', xmlstr) 
			, cb
		);
	};
    
    this.deleteEntry = function(day_entry_id, cb) {
        this.procResults(this.client.runOp('delete', '/daily/delete/' + day_entry_id), cb);
    };
    
    this.updateEntry = function(day_entry_id, project_id, task_id, date_logged, notes, hours, cb) {
        xmlstr = '<request><notes>' + notes + '</notes><hours>' + hours + '</hours>'
                    + '<spent_at type="date">' + date_logged + '</spent_at>'
                    + '<project_id type="integer">' + project_id + '</project_id>'
                    + '<task_id type="integer">' + task_id + '</task_id>'
                    + '</request>';
        this.procResults(
        	this.client.runOp('post', '/daily/update/' + day_entry_id, xmlstr)
            , cb
        );
    };
    
    /*****
     * getClients()
     * 
     * Gets a list of all clients
     * 
     *****/
    this.getClients = function(cb) {
        this.procResults(
            this.client.runOp('get', '/clients')
            , cb
        );
    };

    /*****
    * getSingularClient()
    * 
    * Gets details about a single client
    * 
    *****/
    this.getSingularClient = function(client_id, cb) {
        this.procResults(
            this.client.runOp('get', '/clients/' + client_id)
            , cb
        );
    };
    
    /*****
    * createNewClient()
    * 
    * Creates a new client
    * 
    * client_name is required, and is the company name or a person's name
    * details are not required, but would be address, phone, website, etc
    * 
    * This HTTP response is 201 with the new client ID in this style:
    * /clients/#{new_client_id}
    *****/
    this.createNewClient = function(client_name, details, cb) {
        xmlstr = '<client>'
                + '<name>' + client_name + '</name>';
        
        if(typeof details !== 'function') {
            xmlstr += '<details>' + details + '</details>';
        }
        
        xmlstr += '</client>';
        
        // Instead of having procresults call the callback, I think we should either:
        // 1. Handle it ourselves since this is a 201, parse out the new client ID
        //    and send it to the client as JSON, or
        // 2. Handle 201 events in procResults if there is consistency in
        //    the Harvest API with regards to how resultant URLs are returned
        this.procResults(
            this.client.runOp('post', '/clients/', xmlstr)
            , cb
        );
    };
};

var _exports = { Harvest: Harvest };
