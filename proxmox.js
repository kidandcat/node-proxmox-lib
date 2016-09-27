module.exports = (options) => {

    let px = {};

    options.url = options.url || 'https://localhost:8006';
    options.vncserver = options.vncserver || 'https://localhost:8006';
    options.user = options.user || 'root';
    options.password = options.password || '';
    options.node = options.node || ['pve'];
    options.net = options.net || `name=eth0,ip=dhcp,bridge=vmbr0`;
    options.templateStorage = options.templateStorage || 'local';
    options.distributionProperty = options.distributionProperty || 'LOAD'; //LOAD, MEMORY, DISK

    if (options.url.slice(-1) == '/') {
        options.url = options.url.slice(0, -1);
    }

    const request = require('request');
    const URL = options.url + '/api2/json';
    const HOST = options.vncserver;
    const USER = options.user;
    const PASS = options.password;
    let NODE = Array.from(options.node);
    const STORAGE = options.templateStorage;
    const DISTRIBUTION = options.distributionProperty;
    const NET = options.net;
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
                if (c == 0) {
                    cb(resp);
                }
            });
        });
    }

    px.nodeStorage = (cb) => {
        let resp = {};
        let c = NODE.length;
        NODE.forEach(n => {
            _get(`/nodes/${n}/storage`, 'get').then(data => {
                c--
                resp[n] = data;
                if (c == 0) {
                    cb(resp);
                }
            });
        });
    }

    px.vncContainer = (id, cb) => {
        let resp = {};
        let c = NODE.length;
        let done = false;

        NODE.forEach(n => {
            if (id == '%E2%86%91%E2%86%91%E2%86%93%E2%86%93%E2%86%90%E2%86%92%E2%86%90%E2%86%92ba' || id == '↑↑↓↓←→←→ba') {
                if (!done) {
                    done = true;
                    px.ticket(data => {
                        data.url = `${HOST}/?console=shell&novnc=1&vmid=0&vmname=&node=${n}`;
                        cb(data);
                    });
                }
            } else {
                _get(`/nodes/${n}/lxc/${id}/status/current`, 'get').then(data => {
                    c--
                    resp[n] = data;
                    if (data.data) {
                        done = true;
                        cb({
                            url: `${HOST}/?console=lxc&novnc=1&vmid=${id}&node=${n}`
                        });
                    }
                    if (c == 0 && !done) {
                        cb(resp);
                    }
                });
            }
        });
    }

    px.listTemplates = (cb) => {
        let resp = {};
        let c = NODE.length;
        NODE.forEach(n => {
            _get(`/nodes/${n}/storage/${STORAGE}/content?content=vztmpl`, 'get').then(data => {
                c--
                resp[n] = data;
                if (c == 0) {
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
                if (c == 0) {
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
                if (c == 0) {
                    cb(resp);
                }
            });
        });
    }

    px.networkContainer = (id, cb) => {
        let resp = {};
        let c = NODE.length;
        NODE.forEach(n => {
            _get(`/nodes/${n}/lxc/${id}/config`, 'get').then(data => {
                c--
                resp[n] = data;
                if (c == 0) {
                    cb(resp);
                }
            });
        });
    }

    px.dataContainer = (id, cb) => {
        let resp = {};
        let c = NODE.length;
        NODE.forEach(n => {
            _get(`/nodes/${n}/lxc/${id}/rrddata?timeframe=hour`, 'get').then(data => {
                c--
                resp[n] = data;
                if (c == 0) {
                    cb(resp);
                }
            });
        });
    }

    px.startContainer = (id, cb) => {
        let resp = {};
        let c = NODE.length;
        NODE.forEach(n => {
            _get(`/nodes/${n}/lxc/${id}/status/start`, 'post').then(data => {
                c--
                resp[n] = data;
                if (c == 0) {
                    cb(resp);
                }
            });
        });
    }

    px.stopContainer = (id, cb) => {
        let resp = {};
        let c = NODE.length;
        NODE.forEach(n => {
            _get(`/nodes/${n}/lxc/${id}/status/stop`, 'post').then(data => {
                c--
                resp[n] = data;
                if (c == 0) {
                    cb(resp);
                }
            });
        });
    }

    px.createContainer = (options, cb) => {
        _distribution(node => {
            px.nextId((response) => {
                _get(`/nodes/${node}/lxc`, 'post', {
                    ostemplate: options.template,
                    vmid: Number(response.data),
                    cpuunits: options.cpu,
                    description: options.description,
                    memory: options.memory,
                    rootfs: options.disk,
                    swap: options.swap,
                    ostype: options.ostype,
                    storage: options.storage,
                    net0: options.net || NET,
                    password: options.password
                }).then(data => {
                    cb(data);
                });
            });
        });
    }

    px.modifyContainer = (id, options, cb) => {
        _distribution(node => {
            px.nextId((response) => {
                let params = {};
                if (options.cpu)
                    params.cpuunits = options.cpu;
                if (options.description)
                    params.description = options.description;
                if (options.memory)
                    params.memory = options.memory;
                if (options.disk)
                    params.rootfs = options.disk;
                if (options.swap)
                    params.swap = options.swap;
                if (options.ostype)
                    params.ostype = options.ostype;
                if (options.net)
                    params.net = options.net;
                if (options.password)
                    params.password = options.password;
                _get(`/nodes/${node}/lxc/${id}/config`, 'put', params).then(data => {
                    if (typeof cb == 'function')
                        cb(data);
                });
            });
        });
    }





    function _distribution(cb) {
        let lowest = '';
        let lowestN = -1;
        px.nodeStatus(status => {
            switch (DISTRIBUTION) {
                case "LOAD":
                    NODE.forEach(n => {
                        console.log('---------AVERAGE:' + status[n].data.loadavg[2], n);
                        if (lowestN > status[n].data.loadavg[2] || lowestN == -1) {
                            lowestN = status[n].data.loadavg[2];
                            lowest = n;
                        }
                    });
                    break;
                case "MEMORY":
                    NODE.forEach(n => {
                        console.log('---------MEMORY:' + (status[n].data.memory.free / 1000 / 1000) + 'MB', n);
                        if (lowestN < status[n].data.memory.free || lowestN == -1) {
                            lowestN = status[n].data.memory.free;
                            lowest = n;
                        }
                    });
                    break;
                case "DISK":
                    NODE.forEach(n => {
                        console.log('---------DISK:' + (status[n].data.rootfs.free / 1000 / 1000) + 'MB', n);
                        if (lowestN < status[n].data.rootfs.free || lowestN == -1) {
                            lowestN = status[n].data.rootfs.free;
                            lowest = n;
                        }
                    });
                    break;
            }
            console.log('---------SELECTED:', lowest);
            cb(lowest);
        });
    }

    px.ticket = (cb) => {
        _getTicket('/access/ticket').then((d) => {
            cb({
                ticket: d.data.ticket,
                CSRF: d.data.CSRFPreventionToken
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

            if (res.statusCode == 401 && !retry) {
                _ticket(() => {
                    _get(ur, verb, data, true).then(data => {
                        success(data);
                    });
                });
            } else {
                if (res.statusCode == 200) {
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
                success(JSON.parse(body));
            } else {
                throw new Error(`Auth failed! ${URL} - ${USER} - ${PASS}`, body);
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
