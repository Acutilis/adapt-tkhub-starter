#!/usr/bin/env python

import hashlib
import json
import os.path

import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web

from tornado.options import define, options

define("port", default=8000, help="run on the given port", type=int)

class APIServerBase(tornado.web.RequestHandler):
    ADAPT_COURSE_HOST = "http://localhost:9001"

    def options(self):
        # Set this variable to the url where your Adapt course is running
        # the server needs to take care of CORS
        self.add_header("Access-Control-Allow-Origin", self.ADAPT_COURSE_HOST )
        self.add_header("Access-Control-Allow-Headers", "Content-Type")
        # , Access-Control-Allow-Headers, Authorization, X-Requested-With"

    def getFileName(self, activity, actor):
        activityStr = json.dumps(activity)
        actorStr = json.dumps(actor)
        return hashlib.md5( activityStr + actorStr).hexdigest() + '.json'

class Event(APIServerBase):
    def post(self):
        self.set_header("Access-Control-Allow-Origin", self.ADAPT_COURSE_HOST)
        print self.request.body
        self.write('OK')

class State(APIServerBase):
    def post(self):
        self.set_header("Access-Control-Allow-Origin", self.ADAPT_COURSE_HOST)
        obj = json.loads(self.request.body)
        obj['user_id'] = str(obj['user_id'])
        print 'course_id received from course = ' + obj['course_id']
        print 'user_id received from course = ' + obj['user_id']
        fname = self.getFileName(obj['course_id'], obj['user_id'])
        fo = open(fname,"w")
        fo.write(json.dumps(obj['data'], ensure_ascii=False))
        fo.close()
        print "Saved state to file %s\n"%(fname,)
        self.write('OK')

    def get(self):
        self.set_header("Access-Control-Allow-Origin", self.ADAPT_COURSE_HOST)
        user_id=self.get_argument("user_id", None, True)
        print 'user_id = ' + user_id
        course_id=self.get_argument("course_id", None, True)
        print 'course_id = ' + course_id
        fname = self.getFileName(course_id, user_id)
        print 'fname = ' + fname
        stateStr = json.dumps({})
        if os.path.isfile(fname):
            print 'data found for user and course'
            fo = open(fname,"r")
            stateStr = fo.read()
            fo.close()
            print "Loaded state from file %s.\n"%(fname,)
        self.write(stateStr)
        print "Sent state to client. "


if __name__ == "__main__":
    tornado.options.parse_command_line()
    tornado.log.enable_pretty_logging()
    app = tornado.web.Application(
        handlers=[
            (r"/API/events", Event),
            (r"/API/state", State)
        ]
    )

    http_server = tornado.httpserver.HTTPServer(app)

    print "Example API server listening on port %d"%(options.port,)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
