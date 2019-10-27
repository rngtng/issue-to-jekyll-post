import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs'
import * as path from 'path'
import moment = require('moment-timezone')
import glob = require('glob');

async function run() {
  try {
    const post_dir = core.getInput('post_dir').trim().replace(/\/+$/, "");
    const update_fn = core.getInput('update_filename').trim().toLowerCase()
    set_timezone()

    const context = github.context
    core.debug(JSON.stringify(context, undefined, 2))
    const issue = context.payload.issue
    if (issue == undefined || context.eventName != "issues") {
      console.log('non-issue event. exiting.')
      return;
    }

    const issue_title: string = issue.title.trim()
    const title_fmt = issue_title.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/\/|\\|\:|\*|\?|"|<|>|\|/g, "_");
    const found_file: string = find_existing_file(title_fmt, post_dir);
    const output_fn = (!found_file || update_fn == "true")
      ? get_filename(title_fmt, post_dir)
      : found_file;

    const content = `---
layout: ${core.getInput('layout') || 'default'}
title: "${issue_title}"
tags: ${JSON.stringify(label_names(issue.labels))}
date: ${moment().format('Y-MM-DD HH:mm:ss ZZ')}
---

# ${issue_title}

${issue.body}

## Original issue and comments

${issue.html_url}
`
    core.debug(content)
    if (found_file && update_fn) {
      fs.unlinkSync(found_file)
    }
    fs.writeFile(output_fn, content, function (err) {
      if (err) console.log(err);
      else console.log(`successfully write in ${output_fn}`)
    })
  } catch (error) {
    core.setFailed(error.message);
  }
}

function set_timezone(): void {
  const timezone = core.getInput('timezone')
  if (timezone) {
    moment.tz.setDefault(timezone)
    core.debug(`Timezone is set ${timezone}`)
    core.debug(moment().format())
  } else {
    core.debug("Use the default timezone")
    core.debug(moment().format())
  }
}

function get_filename(title: string, post_dir: string): string {
  const date: string = moment().format("YYYY-MM-DD");
  return path.join(post_dir, date + "-" + title + ".md");
}

function find_existing_file(title: string, post_dir: string): string {
  const match = glob.sync(
    post_dir + "/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]-" + title + ".md",
    { "nodir": true, "nonull": false, "nosort": false }
  );
  if (match.length == 0) return '';
  core.debug(`glob match = [${match}]`);
  return match[match.length - 1];
}

function label_names(labels: Array<{ name: string }>): Array<string> {
  let names: Array<string> = []
  for (let i = 0; i < labels.length; ++i) {
    names.push(labels[i].name)
  }
  return names
}

run();
