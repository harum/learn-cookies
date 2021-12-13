function EventBuilder(helpers, models) {
    this._pageUuid = helpers.generateUUID();
    this._appName = models.getAppName();
    this._platform = models.getPlatform();
    this._userId = null;
    this._getDefaultProperties = function(falcon_version) {
        return {
            app_name: this._appName,
            login: this._userId !== "" && this._userId !== null && this._userId !== undefined,
            platform: this._platform,
            uuid: this._pageUuid,
            falcon_version: falcon_version
        }
    };
    this.construct = function(attributes) {
        this._userId = models.getLoggedInUserId(this._appName);
        var eventId = helpers.generateUUID();
        var defaultProperties = this._getDefaultProperties(attributes.falcon_version);
        properties = helpers.extend(defaultProperties, attributes.properties);
        return {
            id: eventId,
            visit_token: attributes.visit_token,
            visitor_token: attributes.visitor_token,
            user_id: this._userId,
            name: attributes.name,
            properties: properties,
            time: (new Date).getTime() / 1e3
        }
    }
}

function VisitBuilder(models) {
    this._appName = models.getAppName();
    this._userId = models.getLoggedInUserId(this._appName);
    this._platform = models.getPlatform();
    this.construct = function(attributes) {
        return {
            visit_token: attributes.visit_token,
            visitor_token: attributes.visitor_token,
            user_id: this._userId,
            app_name: this._appName,
            platform: this._platform,
            landing_page: window.location.href,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            referrer: document.referrer.length > 0 ? document.referrer : undefined,
            falcon_version: attributes.falcon_version
        }
    }
}
var AhoyConfigFactory = function() {
    window.ahoyUserDefinedConfig = window.ahoyUserDefinedConfig || {};
    var config = {};
    config.visitTtl = window.ahoyUserDefinedConfig.visitTtl || 30; // 30 minutes
    config.visitorTtl = window.ahoyUserDefinedConfig.visitorTtl || 2 * 365 * 24 * 60; // 2 years
    config.cookieSizeLimit = window.ahoyUserDefinedConfig.cookieSizeLimit || 3e3;
    config.batchInterval = window.ahoyUserDefinedConfig.batchInterval || 3e3;
    config.userId = window.ahoyUserDefinedConfig.userId || undefined;
    config.appName = window.ahoyUserDefinedConfig.appName || undefined;
    config.page = window.location.pathname;
    config.hostname = window.location.hostname;
    config.plentyHostname = {
        production: window.ahoyUserDefinedConfig.plentyHostnameProduction || "https://plenty.vidio.com",
        staging: window.ahoyUserDefinedConfig.plentyHostnameStaging || "https://staging-plenty.vidio.com",
        development: window.ahoyUserDefinedConfig.plentyHostnameDevelopment || "http://127.0.0.1:5009"
    };
    config.getVisitUrl = function() {
        if (config.getEnvironment() == "staging") {
            return config.plentyHostname.staging + "/ahoy/visits"
        } else if (config.getEnvironment() == "production") {
            return config.plentyHostname.production + "/ahoy/visits"
        } else {
            return config.plentyHostname.development + "/ahoy/visits"
        }
    };
    config.getEventUrl = function() {
        if (config.getEnvironment() == "staging") {
            return config.plentyHostname.staging + "/ahoy/events"
        } else if (config.getEnvironment() == "production") {
            return config.plentyHostname.production + "/ahoy/events"
        } else {
            return config.plentyHostname.development + "/ahoy/events"
        }
    };
    config.getBatchEventUrl = function() {
        if (config.getEnvironment() == "staging") {
            return config.plentyHostname.staging + "/events"
        } else if (config.getEnvironment() == "production") {
            return config.plentyHostname.production + "/events"
        } else {
            return config.plentyHostname.development + "/events"
        }
    };
    config.getEnvironment = function() {
        var hostname = config.hostname;
        if (window.ahoyUserDefinedConfig.environment != undefined) {
            return window.ahoyUserDefinedConfig.environment
        } else if (hostname.indexOf("staging") > -1 || hostname.indexOf("int") > -1) {
            return "staging"
        } else if (/\.?(vidio)\.com$|\.?analisis\.io$/.test(hostname)) {
            return "production"
        } else {
            return "development"
        }
    };
    config.testLocalStorage = function() {
        try {
            window.localStorage.setItem("test", 1);
            window.localStorage.removeItem("test");
            return true
        } catch (e) {
            return false
        }
    };
    config.isUseLocalStorage = config.testLocalStorage();
    config.isSendBatchEvent = config.isUseLocalStorage && window.ahoyUserDefinedConfig.sendBatch;
    config.visitsUrl = config.getVisitUrl();
    config.eventsUrl = config.getEventUrl();
    config.batchEventsUrl = config.getBatchEventUrl();
    return config
};

function CookieJar() {
    this.setData = function(name, value, ttl) {
        document.cookie = this._constructCookieString(name, value, ttl, true, "none")
    };
    this.getData = function(name) {
        var nameEQ = name + "=";
        var cookieList = document.cookie.split(";");
        var chr;
        for (var i = 0; i < cookieList.length; i++) {
            chr = cookieList[i];
            while (chr.charAt(0) === " ") {
                chr = chr.substring(1, chr.length)
            }
            if (chr.indexOf(nameEQ) === 0) {
                return unescape(chr.substring(nameEQ.length, chr.length))
            }
        }
        return null
    };
    this.deleteData = function(name) {
        var cookies = document.cookie.split("; ");
        cookies = cookies.filter(function(cookie) {
            return cookie !== ""
        });
        for (var i = 0; i < cookies.length; i++) {
            var domainName = window.location.hostname.split(".");
            while (domainName.length > 0) {
                if (cookies[i].split(";")[0].split("=")[0] === name) {
                    var cookieBase = encodeURIComponent(cookies[i].split(";")[0].split("=")[0]) + "=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=" + domainName.join(".") + " ;path=";
                    var p = location.pathname.split("/");
                    document.cookie = cookieBase + "/";
                    while (p.length > 0) {
                        document.cookie = cookieBase + p.join("/");
                        p.pop()
                    }
                    domainName.shift()
                }
            }
        }
    };
    this.getCookieDomain = function() {
        var hostname = this._getHostname();
        var isIP = this._isIP(hostname);
        if (isIP) {
            return hostname
        }
        var components = hostname.split(".");
        if (components.length > 2) {
            components = components.slice(1)
        }
        return components.join(".")
    };
    this.deleteAhoyCookie = function() {
        this.deleteData("ahoy_visit");
        this.deleteData("ahoy_visitor");
        this.deleteData("ahoy_events");
        return true
    };
    this.isCookiesEnabled = function() {
        this.setData("is_cookie_active", "true", 5);
        var someCookies = this.getData("is_cookie_active");
        return someCookies == "true"
    };
    this._constructCookieString = function(name, value, ttl, secure, sameSite) {
        var cookieString = name + "=" + escape(value);
        if (ttl) {
            var date = new Date;
            date.setTime(date.getTime() + ttl * 60 * 1e3);
            cookieString += "; expires=" + date.toGMTString()
        }
        cookieString += "; domain=" + this.getCookieDomain();
        // if (secure) {
        //     cookieString += "; Secure"
        // }
        if (sameSite) {
            cookieString += "; SameSite=" + sameSite + ""
        }
        cookieString += "; path=/";
        return cookieString
    };
    this._isIP = function(hostname) {
        var splittedHostName = hostname.split(".");
        if (splittedHostName.length != 4) {
            return false
        }
        return splittedHostName.reduce(function(accum, current) {
            return accum && (current >= 0 && current < 256)
        }, true)
    };
    this._getHostname = function() {
        return window.location.hostname
    }
}

function Helpers() {
    //NO QA PLS
    this.post = function(url, jsonData, callback) {
        var request = new XMLHttpRequest;
        request.onreadystatechange = function() {
            if (request.readyState === 4 && (request.status === 200 || request.status === 400)) {
                callback()
            }
        };
        request.open("POST", url, true);
        request.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
        request.send(jsonData)
    };
    this.extend = function(out) {
        out = out || {};
        for (var i = 1; i < arguments.length; i++) {
            var obj = arguments[i];
            if (!obj) continue;
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (typeof obj[key] === "object") out[key] = this.extend(out[key], obj[key]);
                    else out[key] = obj[key]
                }
            }
        }
        return out
    };
    this.jsonToParams = function(json) {
        return Object.keys(json).map(function(k) {
            return encodeURIComponent(k) + "=" + encodeURIComponent(json[k])
        }).join("&")
    };
    // http://stackoverflow.com/a/8809472
    this.generateUUID = function() {
        var d = (new Date).getTime();
        var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == "x" ? r : r & 3 | 8).toString(16)
        });
        return uuid
    };
    this.isNull = function(target) {
        return target === null || target === undefined
    }
}

function LocalJar() {
    this.setData = function(name, value, ttl) {
        var expiredDate = new Date;
        if (ttl) {
            expiredDate.setMinutes(expiredDate.getMinutes() + ttl)
        } else {
            expiredDate.setFullYear(expiredDate.getFullYear() + 2)
        }
        window.localStorage.setItem(name, [value, expiredDate])
    };
    this.getData = function(name) {
        var values = window.localStorage.getItem(name);
        if (!values) {
            return null
        }
        var splittedValues = values.split(",");
        var expiredDate = splittedValues.splice(splittedValues.length - 1)[0];
        var value = splittedValues.join(",");
        if (new Date > new Date(expiredDate)) {
            this.deleteData(name);
            return null
        }
        return value
    };
    this.deleteData = function(name) {
        return window.localStorage.removeItem(name)
    }
}

function Models() {
    this.getAppName = function() {
        var domainSegments = this.hostname().split(".");
        return domainSegments.length > 2 ? domainSegments.reverse()[1] : domainSegments[0]
    };
    this.getLoggedInUserId = function(appName) {
        var userId;
        if (appName === "vidio") {
            userId = this.getUserFromVidioCookie();
            if (userId == null) {
                userId = this.getUserFromMeta()
            }
        }
        return userId
    };
    this.getUserFromVidioCookie = function() {
        var cookieJar = new CookieJar;
        return cookieJar.getData("plenty_id")
    };
    this.getUserFromMeta = function() {
        var meta = document.querySelector("meta[name=current-user-id]");
        if (meta) {
            return meta.getAttribute("content")
        }
    };
    this.getUserFromCookie = function() {
        var cookieJar = new CookieJar;
        var serializedCurrentUser = cookieJar.getData("user");
        try {
            var currentUser = JSON.parse(decodeURIComponent(serializedCurrentUser));
            return currentUser.id
        } catch (message) {}
    };
    this.getPlatform = function() {
        var hostname = this.hostname();
        var useragent = this.useragent();
        if (hostname.indexOf("m.vidio.com") > -1 || hostname.indexOf("m.staging.vidio.com") > -1 || hostname.indexOf("m.int.vidio.com") > -1) {
            return "web-mobile"
        } else if (hostname.indexOf("www.vidio.com") > -1 || hostname.indexOf("staging.vidio.com") > -1 || hostname.indexOf("int.vidio.com") > -1) {
            return "web-desktop"
        } else if (useragent.indexOf("Tizen") > -1) {
            return "tv-tizen"
        } else {
            return "unknown"
        }
    };
    this.useragent = function() {
        return window.navigator.userAgent
    };
    this.hostname = function() {
        return window.location.hostname
    }
}

function Tracker(visitStorage, eventStorage, helpers, models, config) {
    this.visitStorage = visitStorage;
    this.eventStorage = eventStorage;
    this.helpers = helpers;
    this.models = models;
    this.config = config;
    this.batchIntervalId = null;
    this.visitId = null;
    this.visitorId = null;
    this.falconVersion = null;
    this.isReady = false;
    this.queue = [];
    this.eventQueue = [];
    this.canStringify = typeof JSON !== "undefined" && typeof JSON.stringify !== "undefined"; // NO QA PLS
    this.visitBuilder = new VisitBuilder(models);
    this.eventBuilder = new EventBuilder(helpers, models);
    this.init = function() {
      console.log('init...');
        var falconVersion = this._documentCurrentScriptSource();
        if (falconVersion) {
            this.falconVersion = falconVersion.substring(falconVersion.indexOf("ahoy-"), falconVersion.indexOf(".js"))
        } else {
            this.falconVersion = "unknown"
        }
        // if (this.isVisitIdOrVisitorIdEmpty()) {
        //     this.setupVisitIdAndVisitorId();
        //     this.prepareAndSendVisitsData()
        // } else {
        //     this.refreshVisitId();
        //     this.setReady()
        // }
        // this.consumeAllEventsInQueues()
    };
    this.isVisitIdOrVisitorIdEmpty = function() {
        this.visitId = this.visitStorage.getData("ahoy_visit") ? this.visitStorage.getData("ahoy_visit") : window.ahoyUserDefinedConfig.visitId;
        this.visitorId = this.visitStorage.getData("ahoy_visitor") ? this.visitStorage.getData("ahoy_visitor") : window.ahoyUserDefinedConfig.visitorId;
        return !this.visitId || !this.visitorId
    };
    this.setupVisitIdAndVisitorId = function() {
        if (!this.visitorId) {
            this.visitorId = this.helpers.generateUUID();
            this.visitStorage.setData("ahoy_visitor", this.visitorId, this.config.visitorTtl);
            // force delete with expiration
            window.ahoyUserDefinedConfig.visitorId = this.visitorId;
            this.visitId = null
        }
        if (!this.visitId) {
            this.refreshVisitId()
        }
    };
    this.refreshVisitId = function() {
        if (!this.visitId) {
            this.visitId = this.helpers.generateUUID()
        }
        this.visitStorage.setData("ahoy_visit", this.visitId, this.config.visitTtl);
        window.ahoyUserDefinedConfig.visitId = this.visitId
    };
    this.prepareAndSendVisitsData = function() {
        var jsonData = this.visitBuilder.construct({
            visit_token: this.visitId,
            visitor_token: this.visitorId,
            falcon_version: this.falconVersion
        });
        this.helpers.post(this.config.visitsUrl, JSON.stringify(jsonData), this.setReady)
    };
    this.setReady = function() {
        var queue = this.queue || window.ahoy.queue;
        var callback = queue.shift();
        while (callback) {
            callback();
            callback = queue.shift()
        }
        this.isReady = true
    };
    this.consumeAllEventsInQueues = function() {
        try {
            this.eventQueue = JSON.parse(this.eventStorage.getData("ahoy_events") || "[]")
        } catch (e) {
            // do nothing
        }
        this.consumeEventQueue();
        this.consumeAhoyQueue();
        this.visitId = this.visitStorage.getData("ahoy_visit") ? this.visitStorage.getData("ahoy_visit") : window.ahoyUserDefinedConfig.visitId
    };
    this.consumeEventQueue = function() {
        if (this.config.isSendBatchEvent) {
            this.trackBatchEvent();
            this.batchIntervalId = setInterval(this.trackBatchEvent.bind(this), this.config.batchInterval)
        } else {
            for (var i = 0; i < this.eventQueue.length; i++) {
                this.trackEvent(this.eventQueue[i])
            }
        }
    };
    this.consumeAhoyQueue = function() {
        if (window.ahoy_q !== undefined) {
            for (var c = 0; c < window.ahoy_q.length; c++) {
                var name = window.ahoy_q[c][0];
                var properties = window.ahoy_q[c][1];
                this.track(name, properties)
            }
            window.ahoy_q = []
        }
    };
    this.track = function(name, properties) {
        /* if this.visitId is null, then throw it away (?) */
        if (!this.canStringify) {
            return
        }
        var event = this.eventBuilder.construct({
            name: name,
            visit_token: this.visitId,
            visitor_token: this.visitorId,
            falcon_version: this.falconVersion,
            properties: properties
        });
        this.eventQueue.push(event);
        this.saveEventQueue();
        if (!this.config.isSendBatchEvent) {
            setTimeout(function() {
                this.trackEvent(event)
            }.bind(this), 500)
        }
        // keep visit alive
        this.visitStorage.setData("ahoy_visit", this.visitId, this.config.visitTtl);
        this.isReady = true
    };
    this.emptyEventQueue = function() {
        this.eventQueue = [];
        this.saveEventQueue()
    };
    this.trackBatchEvent = function() {
        if (this.eventQueue.length !== 0) {
            this.helpers.post(this.config.batchEventsUrl, JSON.stringify(this.eventQueue), this.emptyEventQueue.bind(this))
        }
    };
    this.emptySpecificEventQueue = function(event) {
        if (this.eventQueue !== undefined) {
            for (var i = 0; i < this.eventQueue.length; i++) {
                if (this.eventQueue[i].id == event.id) {
                    this.eventQueue.splice(i, 1);
                    break
                }
            }
            this.saveEventQueue()
        }
    };
    this.trackEvent = function(event) {
        if (this.isReady) {
            this.helpers.post(this.config.eventsUrl, JSON.stringify(event), this.emptySpecificEventQueue)
        } else {
            this.queue.push(this.helpers.post(this.config.eventsUrl, JSON.stringify(event), this.emptySpecificEventQueue))
        }
    };
    this.saveEventQueue = function() {
        // TODO add stringify method for IE 7 and under
        if (this.canStringify) {
            // We limit the cookie size, because some browser, seems doesn't have any limit for cookie
            // which can be problematic for our varnish
            // Ref 1: http://browsercookielimits.squawky.net/
            // Ref 2: https://s3.amazonaws.com/prod.tracker2/resource/73911429/tcp.log?response-content-disposition=inline&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJEX3ET63U5T77TYA%2F20170202%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20170202T094342Z&X-Amz-Expires=1800&X-Amz-SignedHeaders=host&X-Amz-Signature=925cf381392b1eec606b7e643885e55715b89602a4b2d3b23b2f39e20989974d
            // And because the cookie is encoded, we will check the encoded length instead plain length
            if (this.config.isUseLocalStorage || JSON.stringify(this.eventQueue).length <= this.config.cookieSizeLimit && this.helpers.jsonToParams(this.eventQueue).length <= this.config.cookieSizeLimit) {
                this.eventStorage.setData("ahoy_events", JSON.stringify(this.eventQueue), 1)
            }
        }
    };
    this._documentCurrentScriptSource = function() {
        if (document.currentScript) {
            return document.currentScript.src
        } else {
            return null
        }
    }
}
var ahoySendBatchEvent = true;
var AhoyConfig = new AhoyConfigFactory;
var helpers = new Helpers;
var models = new Models;
var visitStorage = new CookieJar;
var eventStorage;
if (AhoyConfig.isUseLocalStorage) {
    eventStorage = new LocalJar
} else {
    eventStorage = new CookieJar
}
window.ahoy = new Tracker(visitStorage, eventStorage, helpers, models, AhoyConfig);
window.ahoy.init();
