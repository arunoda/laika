laika
=====

### Full Featured Test Suite for Meteor

## Setup

* install meteor on your system (only for meteorite users)
* run a seperate mongodb process with following options (it makes testing faster)
`mongod --smallfiles --noprealloc --nojournal`

## Todo
* added a way to support custom actions both client and server
* add some utility methods(actions) to client (ensureLogin(), etc)
* Make run available via an fiber to make the code simple with evalSync
