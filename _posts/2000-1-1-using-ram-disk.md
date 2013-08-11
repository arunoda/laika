---
layout: post
title: Using a ramdisk for mongodb data directory
visible: false
---

You can make test run **3 times** faster by using a ramdisk for your mongodb data directory. These days most of the dev boxes runs with 8 GB or more RAM. So using 1GB as a ramdisk for mongo should not be a big issue.

## Create your ram disk

### OSX
* Use this [guide](http://bogner.sh/2012/12/os-x-create-a-ram-disk-the-easy-way/) to create a ram disk
* It will new disk drive mounted to `/Volumes/<name you given>`

### Linux
* Use this [stackexchange answer](http://unix.stackexchange.com/a/66331) as a guide

## Start mongodb with ramdisk

    mongod --smallfiles --noprealloc --nojournal --dbpath <ramdisk mounted localtion>
