---
layout: post
title: Continuous Integration
visible: true
---

Continuous Integration support for Laika and Meteor can be added very easily. Laika can be configured to use with Cloud Services and Self Hosted Solutions.

> If you are looking for a how to guide, check out [MeteorHacks](http://meteorhacks.com) article on [Continuous Integration for Meteor Apps](http://meteorhacks.com/continuos-integration-for-meteor-apps.html)

## With Travis CI
add following content to your project as `.travis.yml`

    language: node_js
    node_js:
      - "0.10"
    before_install:
      - "curl -L http://git.io/3l-rRA | /bin/sh"
    services:
      - mongodb
    env: 
      - LAIKA_OPTIONS="-t 5000"

## With CodeShip

Select your technology as nodejs

Replace setup commands with following

    git clone https://github.com/meteor/meteor.git ~/meteor
    export PATH=~/meteor/:$PATH
    npm install -g meteorite laika

Replace test commands with following

    METEOR_PATH=~/meteor laika -t 5000
    I’ve added codeship support for hello-laika as well.

## For others

There are lots of other Continuous Integration services and downloaded servers out there. It is not feasible to provide how-to guides for all. Let's discuss in general how we can add laika support for them.

All of these tools and services provide a way to customize their runtime and the test. Most of the time we can configure them using shell scripts. We can categorize them into two.

* Who gives ROOT access for configuration scripts
* Who don't give us ROOT access for configuration scripts

Laika can be configure for both very easily. Let's look at how.

> * Assume you've configured or installed `nodejs`
> * Assume there is a local mongodb server is running
> * Assume phantomjs is installed and available on the path

### With ROOT access

    #install meteor normally
    curl https://install.meteor.com | /bin/sh

    #installing meteorite and laika
    npm install -g meteorite laika

    #run tests
    laika #<options>

### Without ROOT access

    #install meteor from git
    git clone https://github.com/meteor/meteor.git ~/meteor
    export PATH=~/meteor/:$PATH

    #install meteorite and laika
    npm install -g meteorite laika

    #run tests
    METEOR_PATH=~/meteor laika -t 5000

I hope with this information, you could setup your meteor app for Continuous Integration  very easily. Let me know how you think about this, share your experiences.