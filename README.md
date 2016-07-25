# Proxmox Simple Library

## Status

- #### In progress

## Requirements

- #### Proxmox VE Api Version 2 -> <https://pve.proxmox.com/wiki/Proxmox_VE_API>

## Install

```
npm install proxmox-lib
```

## Use

```
  var px = require('proxmox-lib')({
    url: '<https://localhost:8006/api2/json/>',
    user: 'root',
    password: 'password',
    node: ['node1', 'node2'],
    templateStorage: 'local'
  });
```

## Functions

- px.status(callback) -> Cluster status

- px.nextId(callback) -> Next free VM ID

- px.nodeStatus(callback) -> Node status

- px.listTemplates(callback) -> List container available templates

- px.deleteContainer(id, callback) -> Delete the container

- px.statusContainer(id, callback) -> Status of container

- px.createContainer(options, callback) -> Create container

  - template: 'string',
  - cpu: 'number',
  - hostname: 'string',
  - memory: 'number|megabytes',
  - ostype: 'string|ubuntu,debian,centos,archlinux',
  - storage: 'string',
  - swap: 'number|megabytes',
  - disk: 'number|gigabytes',
  - password: 'string'
