"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const moment = require("moment-timezone");
const glob = require("glob");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const post_dir = core.getInput('post_dir').trim().replace(/\/+$/, "");
            const update_fn = core.getInput('update_filename');
            set_timezone();
            const context = github.context;
            core.debug(JSON.stringify(context, undefined, 2));
            const issue = context.payload.issue;
            if (issue == undefined || context.eventName != "issues") {
                console.log('non-issue event. exiting.');
                return;
            }
            const issue_title = issue.title.trim();
            const title_fmt = issue_title.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/\/|\\|\:|\*|\?|"|<|>|\|/g, "_");
            const found_file = find_existing_file(title_fmt, post_dir);
            const output_fn = (!found_file || update_fn.toLowerCase() == "true")
                ? get_filename(title_fmt, post_dir)
                : found_file;
            const content = `---
title: "${issue_title}"
tags: ${JSON.stringify(label_names(issue.labels))}
---

# ${issue_title}

${issue.body}

## Original issue and comments

${issue.html_url}
`;
            core.debug(content);
            if (found_file && update_fn) {
                fs.unlinkSync(found_file);
            }
            fs.writeFile(output_fn, content, function (err) {
                if (err)
                    console.log(err);
                else
                    console.log(`successfully write in ${output_fn}`);
            });
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function set_timezone() {
    const timezone = core.getInput('timezone');
    if (timezone) {
        moment.tz.setDefault(timezone);
        core.debug(`Timezone is set ${timezone}`);
        core.debug(moment().format());
    }
    else {
        core.debug("Use the default timezone");
        core.debug(moment().format());
    }
}
function get_filename(title, post_dir) {
    const date = moment().format("YYYY-MM-DD");
    return path.join(post_dir, date + "-" + title + ".md");
}
function find_existing_file(title, post_dir) {
    const match = glob.sync(post_dir + "/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]-" + title + ".md", { "nodir": true, "nonull": false, "nosort": false });
    if (match.length == 0)
        return '';
    core.debug(`glob match = ${match}`);
    return match[match.length - 1];
}
function label_names(labels) {
    let names = [];
    for (let i = 0; i < labels.length; ++i) {
        names.push(labels[i].name);
    }
    return names;
}
run();
