module.exports = (options) => {

    let px = {};

    options.url = options.url || 'https://localhost:8006/api2/json/';
    options.user = options.user || 'root';
    options.password = options.password || '';
    options.node = options.node || ['pve'];
    options.templateStorage = options.templateStorage || 'local';

    if (options.url.slice(-1) == '/') {
        options.url = options.url.slice(0, -1);
    }

    const request = require('request');
    const URL = options.url;
    const USER = options.user;
    const PASS = options.password;
    let NODE = Array.from(options.node);
    const STORAGE = options.templateStorage;
    let TICKET = '';
    let CSRF = '';




    px.status = (cb) => {
        _get('/nodes', 'get').then(data => {
            cb(data);
        });
    }

    px.nextId = (cb) => {
        _get('/cluster/nextid', 'get').then(data => {
            cb(data);
        });
    }

    px.nodeStatus = (cb) => {
        let resp = {};
        let c = NODE.length;
        NODE.forEach(n => {
            _get(`/nodes/${n}/status`, 'get').then(data => {
                c--
                resp[n] = data;
                if(c == 0){
                  cb(resp);
                }
            });
        });
    }

    px.listTemplates = (cb) => {
        let resp = {};
        let c = NODE.length;
        NODE.forEach(n => {
            _get(`/nodes/${n}/storage/${STORAGE}/content?content=vztmpl`, 'get').then(data => {
              c--
              resp[n] = data;
              if(c == 0){
                cb(resp);
              }
            });
        });
    }

    px.deleteContainer = (id, cb) => {
        let resp = {};
        let c = NODE.length;
        NODE.forEach(n => {
            _get(`/nodes/${n}/lxc/${id}`, 'delete').then(data => {
              c--
              resp[n] = data;
              if(c == 0){
                cb(resp);
              }
            });
        });
    }

    px.statusContainer = (id, cb) => {
        let resp = {};
        let c = NODE.length;
        NODE.forEach(n => {
            _get(`/nodes/${n}/lxc/${id}/status/current`, 'get').then(data => {
              c--
              resp[n] = data;
              if(c == 0){
                cb(resp);
              }
            });
        });
    }


    px.createContainer = (options, cb) => {
        px.nextId((response) => {
            _get(`/nodes/${NODE}/lxc`, 'post', {
                ostemplate: options.template,
                vmid: Number(response.data),
                cpuunits: options.cpu,
                hostname: options.name,
                memory: options.memory,
                rootfs: options.disk,
                swap: options.swap,
                ostype: options.ostype,
                storage: options.storage,
                password: options.password
            }).then(data => {
                cb(data);
            });
        });
    }





    function _ticket(cb) {
        _getTicket('/access/ticket').then((d) => {
            TICKET = "PVEAuthCookie=" + d.data.ticket;
            CSRF = d.data.CSRFPreventionToken;
            cb();
        });
    }

    function _get(ur, verb, data = null, retry = false) {
        var success = function(c) {};
        var error = function(c) {};
        //Promise

        const path = ur || '';
        console.log(verb + ' ' + URL + path);
        console.log('data:', data);
        request({
            method: verb,
            uri: URL + path,
            form: data,
            strictSSL: false,
            headers: {
                'CSRFPreventionToken': CSRF,
                'Cookie': TICKET
            }
        }, (err, res, body) => {
            if (err) {
                console.log('ERROR:', err);
                error(err);
            }

            console.log(res.statusCode);
            if (res.statusCode == 401 && !retry) {
                _ticket(() => {
                    _get(ur, verb, data, true).then(data => {
                        success(data);
                    });
                });
            } else {
                if (res.statusCode == 200) {
                    console.log('SUCCESS:', body);
                    success(JSON.parse(body));
                } else {
                    success(res.statusMessage + ' - ' + body);
                }
            }
        });

        //Promise
        return {
            then: function(cb) {
                success = cb;
                return this;
            },
            error: function(cb) {
                error = cb;
                return this;
            }
        };
    }

    function _getTicket() {
        var success = function(c) {};
        var error = function(c) {};
        //Promise

        request.post({
            url: URL + `/access/ticket?username=${USER}@pam&password=${PASS}`,
            'strictSSL': false
        }, (err, res, body) => {
            if (err) {
                console.log('ERROR:', err);
                error(err);
            }


            if (res.statusCode == 200) {
                console.log('SUCCESS:', body);
                success(JSON.parse(body));
            } else {
                throw new Error(`Auth failed! ${USER} - ${PASS}`, body);
            }
        });


        //Promise
        return {
            then: function(cb) {
                success = cb;
                return this;
            },
            error: function(cb) {
                error = cb;
                return this;
            }
        };
    }


    return px;
}
