# Learn Cookies

This repo is used as a demo to show how we can use cookies in our website and as
a tracking mechanism.

## Installation
Clone the repos
```
git@github.com:harum/learn-cookies.git
```

There are 2 servers in this demo project. You need to do installation on both
server.

```
cd web
npm install

cd ../socmed
npm install
```

This demo use custom local hostnames.
```
sudo vim /etc/hosts
```
or
```
sudo nano /etc/hosts
```

Add these hostnames.
```
127.0.0.1 www.weblocal.com
127.0.0.1 blog.weblocal.com
127.0.0.1 www.socmedlocal.com
127.0.0.1 tracker.socmedlocal.com
```

## Run Demo
```
cd web
npm run start
```

```
cd socmed
npm run start
```

### Demo Steps
1. Visit `https://www.weblocal.com:3000/`. Check the cookies that added when you
   visit the page.
1. Visit `https://www.weblocal.com:3000/theme` to try updating cookies from
   client side.
1. Visit `https://www.weblocal.com:3000/articles/{id}` to try visiting article
   page that will be tracked by the tracker site.
1. Visit `https://www.socmedlocal.com:3004/`
1. Visit `https://www.socmedlocal.com:3004/track` and you can see the history of
   articles that already visited by the user.
